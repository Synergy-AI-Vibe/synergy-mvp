// 재료 → 가격. 기획서 8절의 3계층 구조를 그대로 코드로 옮긴 것.
//   tier1 공공 API(KAMIS/참가격)  → 지금은 seed.js 스냅샷으로 대체 (키 없이도 UI 검증 가능)
//   tier2 오픈마켓 크롤링          → 미구현. 훅만 남겨 둠
//   tier3 사용자 직접 입력         → overrides 로 주입
import { toBaseAmount } from '../parse/units.js';
import SEED_DATA from './seed.js';
import { hasKeys as hasKamisKeys, fetchLatestIndex } from './kamis.js';
import { KAMIS_MAP, selectRow } from './kamis-map.js';
import { lookupWebPrice } from './llm-price.js';

const SEED = SEED_DATA;

// --- tier1: KAMIS 실시간 소매가 ---
// 하루 단위 데이터라 프로세스당 한 번만 받아 재사용한다.
let kamisPromise = null;
let kamisState = { tried: false, ok: false, regday: null, itemCount: 0, error: null };

async function getKamis() {
  if (!hasKamisKeys()) return null;
  if (!kamisPromise) {
    kamisPromise = fetchLatestIndex()
      .then((r) => {
        kamisState = { tried: true, ok: !!r && r.rowCount > 0, regday: r?.regday || null, itemCount: r?.index.size || 0, error: null };
        return r && r.rowCount > 0 ? r : null;
      })
      .catch((e) => {
        kamisState = { tried: true, ok: false, regday: null, itemCount: 0, error: e.message };
        return null;
      });
  }
  return kamisPromise;
}

export function kamisStatus() {
  return { ...kamisState, configured: hasKamisKeys() };
}

async function tier1Lookup(canonical, rawName) {
  const spec = KAMIS_MAP[canonical];
  if (!spec) return null;
  const k = await getKamis();
  if (!k) return null;
  const row = selectRow(k.index, spec, rawName);
  if (!row) return null;

  let unitPrice = row.unitPrice;
  let per = row.base;
  if (per === 'count') {
    // "10구", "1개" 처럼 세는 단위는 재료별 중량이 있어야 g 단가로 바꿀 수 있다
    if (!spec.countWeight) return null;
    unitPrice = row.unitPrice / spec.countWeight;
    per = 'g';
  }

  return {
    per,
    unitPrice: Math.round(unitPrice * 100) / 100,
    sourceName: `KAMIS ${row.category} 소매가 · ${describeRow(row)}`,
    asOf: row.asOf,
    live: true,
  };
}

/**
 * 화면에 그대로 나가는 출처 문구를 만든다.
 * KAMIS 는 item_name·kind_name·rank 가 서로 겹치는 경우가 많아서
 * (파/대파(1kg)/상품, 돼지/삼겹살/삼겹살) 그대로 이으면 중복돼 보인다.
 */
function describeRow(row) {
  const kind = String(row.kindName || '').replace(/\s*\([^)]*\)\s*$/, '').trim();
  let label;
  if (!kind) label = row.itemName;
  else if (kind.includes(row.itemName) || row.itemName.includes(kind)) label = kind;
  else label = `${row.itemName} ${kind}`;

  const rank = String(row.rank || '').trim();
  const meaningful = rank && rank !== '-' && rank !== kind && !/^\d+(구|개|kg|g)$/.test(rank);
  return meaningful ? `${label} ${rank}` : label;
}

// 레시피 표기 → 가격 DB 표준 품목명
const ALIASES = [
  // 우삼겹은 소고기라 돼지고기보다 먼저 걸러야 한다('삼겹'이 겹친다)
  [/(우삼겹|차돌박이|차돌)/, '차돌박이'],
  // ── 가공식품 (2026-09-03 조사분) ──
  // 뒤의 원물 규칙보다 먼저 걸러야 한다: 감자전분→감자, 튀김가루→김(김가루),
  // 토마토소스→토마토, 오징어채→물오징어, 참치액→참치 로 오매핑되던 문제.
  [/(감자\s?전분|옥수수\s?전분|전분\s?가루|전분)/, '전분'],
  [/(튀김\s?가루)/, '튀김가루'],
  [/(빵가루)/, '빵가루'],
  [/(밀가루|중력분|박력분|강력분)/, '밀가루'],
  [/(토마토\s?소스|파스타\s?소스)/, '토마토소스'],
  [/(진미채|오징어채|오징어\s?실채)/, '진미채'],
  [/(참치캔|캔참치|참치(?!액))/, '참치캔'],
  [/(모짜렐라|모차렐라|피자\s?치즈)/, '모짜렐라치즈'],
  [/(슬라이스\s?치즈|체다\s?치즈)/, '슬라이스치즈'],
  [/(스파게티\s?면|파스타\s?면|스파게티)/, '파스타면'],
  [/(소면|중면|국수)/, '소면'],
  [/(라면\s?사리|사리면)/, '라면사리'],
  [/(만두(?!피))/, '만두'],
  [/(마요네즈)/, '마요네즈'],
  [/(올리브\s?유|올리브\s?오일)/, '올리브유'],
  [/(식초)/, '식초'],
  [/(꿀)/, '꿀'],
  [/(생크림|휘핑\s?크림)/, '생크림'],
  [/(베이컨)/, '베이컨'],
  // 앵커(^)를 두면 '통삼겹'·'수육용 목살'처럼 수식어가 앞에 붙은 표기를 놓친다
  [/(돼지고기|통삼겹|삼겹|목살|목심|앞다리|뒷다리|전지|후지|제육|^돼지)/, '돼지고기'],
  [/(소고기|소불고기|불고기용|한우)/, '소고기'],
  [/^(닭|생닭|닭볶음탕용\s?닭|닭도리탕용).*/, '닭'],
  [/^(계란|달걀).*/, '달걀'],
  [/(다진\s?마늘|다진마늘|통마늘|깐마늘|마늘)/, '마늘'],
  [/(묵은지|신김치|포기김치|배추김치|^김치)/, '김치'],
  [/(진간장|국간장|양조간장|맛간장|^간장)/, '간장'],
  [/(고춧가루|고추가루)/, '고춧가루'],
  [/(황설탕|흑설탕|백설탕|^설탕)/, '설탕'],
  [/(가는소금|고운\s?소금|천일염|^소금)/, '소금'],
  [/(올리고당|물엿|쌀조청|조청)/, '물엿'],
  [/(청주|청하|미림|^맛술)/, '맛술'],
  [/(박력분|중력분|강력분|^밀가루)/, '밀가루'],
  [/(까나리액젓|멸치액젓|^액젓)/, '멸치액젓'],
  [/(참치액|^다시다|미원|msg|치킨스톡|소고기\s?다시다|고향의\s?맛\s?다시다)/i, '다시다'],
  [/(코인육수)/, '코인육수'],
  [/(쌀뜨물|생수|^물$|맹물|정수)/, '물'],
  [/(대파|쪽파|^파$)/, '대파'],
  [/(양파)/, '양파'],
  [/(감자)/, '감자'],
  [/(당근)/, '당근'],
  [/(애호박|호박)/, '애호박'],
  [/(청양고추)/, '청양고추'],
  [/(홍고추|붉은고추)/, '홍고추'],
  [/(두부)/, '두부'],
  [/(시금치)/, '시금치'],
  [/(당면)/, '당면'],
  [/(떡볶이떡|가래떡|밀떡|쌀떡)/, '떡볶이떡'],
  [/(어묵|오뎅)/, '어묵'],
  [/(표고버섯|표고)/, '표고버섯'],
  [/(목이버섯)/, '목이버섯'],
  [/(파프리카)/, '파프리카'],
  [/(고추장)/, '고추장'],
  [/(된장|쌈장)/, '된장'],
  [/(식용유|카놀라유|포도씨유|해바라기유)/, '식용유'],
  [/(참기름)/, '참기름'],
  [/(들기름)/, '들기름'],
  [/(굴소스)/, '굴소스'],
  [/(후추|후춧가루)/, '후추'],
  [/(통깨|깨소금|참깨)/, '통깨'],
  [/(케찹|케첩|토마토케첩)/, '케첩'],
  [/(버터|가염버터|무염버터)/, '버터'],
  [/(카레가루|분말카레|카레분말|오뚜기분말카레|고형카레)/, '카레가루'],
  // 2026-09-03 unmatched_ingredient 수집분 반영 (시드 조사값과 세트)
  [/(부침\s?가루|부침개\s?가루)/, '부침가루'],
  // 밥은 완전 일치만 — 앵커 없이 두면 볶음밥·비빔밥·밥숟가락이 전부 걸린다 (1-2의 예외 케이스)
  [/^(밥|쌀밥|공기밥|흰밥|현미밥|즉석밥|햇반)$/, '즉석밥'],
  [/(스팸|런천미트|리챔)/, '스팸'],
  [/(사골\s?육수|사골\s?국물|사골곰탕)/, '사골육수'],
  [/(들깨\s?가루|들깻가루)/, '들깨가루'],
  [/(소주)/, '소주'],
  [/(레몬)/, '레몬'],
  // 시드에는 없지만 KAMIS 에 있는 품목들
  [/(물오징어|오징어)/, '물오징어'],
  [/(바지락)/, '바지락'],
  [/(새우젓)/, '새우젓'],
  [/(부추)/, '부추'],
  [/(깻잎)/, '깻잎'],
  [/(다진\s?생강|^생강)/, '생강'],
  [/(방울토마토|토마토)/, '토마토'],
  [/(알배기?\s?배추|알배추|^배추|얼갈이)/, '배추'],
  [/(양배추)/, '양배추'],
  [/(브로콜리)/, '브로콜리'],
  [/(오이)/, '오이'],
  [/(무말랭이|^무$)/, '무'],
  [/(팽이버섯)/, '팽이버섯'],
  [/(느타리버섯|느타리)/, '느타리버섯'],
  [/(새송이버섯|새송이)/, '새송이버섯'],
  [/(마른미역|^미역)/, '마른미역'],
  [/(마른김|구운김|^김$|김가루)/, '김'],
  [/(우유)/, '우유'],
  [/(고구마)/, '고구마'],
  [/(^쌀$|백미)/, '쌀'],
];

// 표준 품목명 = 시드 품목 ∪ KAMIS 매핑 품목
const CANONICAL_NAMES = new Set([...Object.keys(SEED.items), ...Object.keys(KAMIS_MAP)]);
export const CANONICAL_LIST = [...CANONICAL_NAMES].filter((n) => n !== '물');

export function canonicalize(name) {
  const n = String(name || '').replace(/\s+/g, ' ').trim();
  for (const [re, key] of ALIASES) if (re.test(n)) return key;
  if (CANONICAL_NAMES.has(n)) return n;
  // 마지막 시도: 공백 제거 후 부분 일치
  const flat = n.replace(/\s/g, '');
  for (const key of CANONICAL_NAMES) if (flat.includes(key)) return key;
  return null;
}

/** tier2: 웹 시세 — LLM + 검색 그라운딩 (llm-price.js). 못 찾으면 조용히 null. */
async function tier2Lookup(canonical, rawName) {
  return lookupWebPrice(canonical || rawName);
}

/**
 * 한 재료의 가격을 푼다.
 * @param item 파서가 만든 재료 객체 ({name, qty, unit, amount})
 * @param overrides { [재료명]: {unitPrice, per} } 사용자가 직접 입력한 값
 */
export async function priceItem(item, overrides = {}, canonicalMap = null) {
  // canonicalMap 이 있으면 그걸 쓴다 (규칙 → DB 캐시 → LLM 3단계를 이미 거친 결과).
  // 없으면 규칙만으로 푼다 — eval/probe 처럼 LLM 없이 돌릴 때의 경로다.
  const canonical = canonicalMap ? (canonicalMap.get(item.name) ?? null) : canonicalize(item.name);

  // 파서는 "다진마늘 5개"의 표준 중량을 모르지만, 표준 품목명(마늘)으로는 알 수 있다.
  // 이름 정규화 이후에 단위 환산을 한 번 더 시도한다.
  if (!item.amount && canonical && item.qty != null && item.unit) {
    const retry = toBaseAmount(item.qty, item.unit, canonical);
    if (retry.convertible) {
      item = {
        ...item,
        amount: { value: Math.round(retry.amount * 100) / 100, base: retry.base, basis: `${retry.basis} (표준 품목명 '${canonical}' 기준)` },
        amountIssue: null,
        confidence: item.confidence === 'medium' ? 'high' : item.confidence,
      };
    }
  }

  const out = {
    ...item,
    canonical,
    price: null,
    priceSource: null,
    cost: null,
    packCost: null,
    issues: [],
  };

  if (!item.amount) {
    out.issues.push({
      code: 'NO_AMOUNT',
      level: item.section && /양념|조미|소스/.test(item.section) ? 'info' : 'warn',
      message: item.amountIssue?.detail || '사용량을 숫자로 환산할 수 없습니다.',
    });
  }

  const override = overrides[item.name] ?? (canonical ? overrides[canonical] : undefined);
  let entry = null;
  let tier = null;
  let sourceName = null;

  const seedEntry = canonical ? SEED.items[canonical] : null;
  const live = canonical ? await tier1Lookup(canonical, item.name) : null;
  let asOf = SEED._meta.asOf;

  if (override) {
    entry = { per: override.per || 'g', unitPrice: Number(override.unitPrice), pack: override.pack || null, category: '사용자입력' };
    tier = 3;
    sourceName = '사용자 직접 입력';
  } else if (live) {
    // 실시간 단가를 쓰되, KAMIS 는 최소 판매 단위를 주지 않으므로
    // 장바구니 계산용 pack 과 분류는 시드 쪽을 그대로 쓴다.
    entry = {
      per: live.per,
      unitPrice: live.unitPrice,
      pack: seedEntry?.pack || null,
      category: seedEntry?.category || guessCategory(item.name),
    };
    tier = 1;
    sourceName = live.sourceName;
    asOf = live.asOf;
  } else if (seedEntry) {
    entry = seedEntry;
    tier = entry.sourceTier;
    sourceName = `${entry.sourceName} (시드)`;
  } else {
    const t2 = await tier2Lookup(canonical, item.name);
    if (t2) {
      entry = { ...t2, category: guessCategory(item.name) };
      tier = 2;
      sourceName = t2.sourceName;
      asOf = t2.asOf || asOf;
    }
  }

  if (!entry) {
    out.issues.push({
      code: 'NO_PRICE',
      level: '조미료' === guessCategory(item.name) ? 'info' : 'warn',
      message: '공공 데이터·시드에 없는 재료입니다. 가격을 직접 입력하거나 계산에서 제외해 주세요.',
    });
    out.category = guessCategory(item.name);
    return out;
  }

  out.category = entry.category;
  out.priceSource = { tier, name: sourceName, asOf, per: entry.per, unitPrice: entry.unitPrice, live: !!live };

  if (item.amount) {
    // 무게↔부피 단위가 어긋나면(예: 가격은 g당인데 사용량은 ml) 밀도 1로 근사한다.
    const mismatched = item.amount.base !== entry.per;
    if (mismatched) {
      out.issues.push({
        code: 'UNIT_APPROX',
        level: 'info',
        message: `사용량은 ${item.amount.base}, 가격은 ${entry.per} 기준이라 1${item.amount.base}≈1${entry.per}로 근사했습니다.`,
      });
    }
    out.cost = Math.round(item.amount.value * entry.unitPrice);
    if (entry.pack) {
      out.packCost = entry.pack.price;
      out.pack = entry.pack;
      out.packRatio = Math.min(1, item.amount.value / entry.pack.size);
    }
  }
  return out;
}

function guessCategory(name) {
  return /(소금|후추|설탕|참기름|들기름|깨|간장|식초|다시다|미원|조미)/.test(name) ? '조미료' : '주재료';
}

/**
 * 재료 목록 전체 → 비용 요약
 * @param canonicalMap 이름 정규화 결과 (analyze.js 가 resolveCanonicalNames 로 미리 만든다).
 *                     넘기지 않으면 규칙만으로 정규화한다.
 */
export async function priceRecipe(items, { overrides = {}, servings = 1, canonicalMap = null } = {}) {
  const priced = [];
  for (const it of items) priced.push(await priceItem(it, overrides, canonicalMap));

  const counted = priced.filter((p) => p.cost != null);
  const excluded = priced.filter((p) => p.cost == null);
  const consumedCost = counted.reduce((s, p) => s + p.cost, 0);
  const basketCost = priced.reduce((s, p) => s + (p.packCost ?? 0), 0);

  // 제외된 재료 중 "주재료"는 금액 왜곡이 크므로 반드시 경고로 띄운다 (기획서 8절)
  const criticalExcluded = excluded.filter((p) => p.category !== '조미료' && p.category !== '무시');

  return {
    items: priced,
    servings,
    summary: {
      consumedCost, // 레시피에 실제로 들어간 양만큼의 원가
      basketCost, // 마트에서 최소 단위로 다 사면 나가는 돈
      perServing: servings > 1 ? Math.round(consumedCost / servings) : consumedCost,
      countedCount: counted.length,
      excludedCount: excluded.length,
      coverage: priced.length ? Math.round((counted.length / priced.length) * 100) : 0,
      criticalExcluded: criticalExcluded.map((p) => p.name),
      tierBreakdown: {
        tier1: counted.filter((p) => p.priceSource?.tier === 1).length,
        tier2: counted.filter((p) => p.priceSource?.tier === 2).length,
        tier3: counted.filter((p) => p.priceSource?.tier === 3).length,
      },
    },
    dataNote: SEED._meta.note,
  };
}

export const PRICE_META = SEED._meta;
