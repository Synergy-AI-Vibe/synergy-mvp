// KAMIS(농산물유통정보) 소매가 어댑터 — tier1 의 농·축·수산물 담당.
//
// 실제 응답을 보고 맞춘 사항:
//  - p_convert_kg_yn 은 'N' 을 쓴다. 'Y' 로 하면 값은 kg 기준으로 바뀌는데
//    unit 필드는 100g 그대로라 서로 어긋난다(시금치: unit=100g, dpr1=23,888).
//    'N' 이면 unit 과 kind_name 의 괄호 표기가 일치한다.
//  - 가격은 "5,343" 처럼 쉼표가 섞인 문자열이고, 조사값이 없으면 "-" 가 온다.
//  - unit 은 품목마다 다르다: 100g / 1kg / 500g / 1포기 / 1개 / 10구 / 1손 / 1L …
//  - 하루 단위 데이터라 날짜별로 한 번만 받아 캐시하면 된다.
import '../env.js';

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';
const ENDPOINT = 'https://www.kamis.or.kr/service/price/xml.do';

export const CATEGORIES = {
  100: '식량작물',
  200: '채소류',
  300: '특용작물',
  400: '과일류',
  500: '축산물',
  600: '수산물',
};

export function hasKeys() {
  return !!(process.env.KAMIS_CERT_KEY && process.env.KAMIS_CERT_ID);
}

/** "1kg" → {base:'g', size:1000}, "10구" → {base:'count', size:10} 처럼 분해한다. */
export function parseUnit(unit) {
  const u = String(unit || '').trim();
  let m = /^(\d+(?:\.\d+)?)\s*(kg|g|L|l|ml|mL)$/.exec(u);
  if (m) {
    const n = Number(m[1]);
    const kind = m[2].toLowerCase();
    if (kind === 'kg') return { base: 'g', size: n * 1000 };
    if (kind === 'g') return { base: 'g', size: n };
    if (kind === 'l') return { base: 'ml', size: n * 1000 };
    return { base: 'ml', size: n };
  }
  // 셈 단위: 1포기 / 1개 / 10개 / 1마리 / 10구 / 1손 / 10장 …
  m = /^(\d+)\s*(포기|개|마리|구|손|장|단|망|속|톨)$/.exec(u);
  if (m) return { base: 'count', size: Number(m[1]), countUnit: m[2] };
  return null;
}

const priceToNumber = (s) => {
  const n = Number(String(s ?? '').replace(/[^\d.]/g, ''));
  return Number.isFinite(n) && n > 0 ? n : null;
};

const yyyymmdd = (d) => d.toISOString().slice(0, 10);

async function fetchCategory(categoryCode, regday) {
  const q = new URLSearchParams({
    action: 'dailyPriceByCategoryList',
    p_product_cls_code: '01', // 01 소매
    p_item_category_code: String(categoryCode),
    p_country_code: '1101', // 서울
    p_regday: regday,
    p_convert_kg_yn: 'N',
    p_cert_key: process.env.KAMIS_CERT_KEY,
    p_cert_id: process.env.KAMIS_CERT_ID,
    p_returntype: 'json',
  });
  const res = await fetch(`${ENDPOINT}?${q}`, {
    headers: { 'User-Agent': UA },
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`KAMIS HTTP ${res.status}`);
  const body = await res.text();
  let json;
  try {
    json = JSON.parse(body);
  } catch {
    // 인증 실패 등은 JSON 이 아닌 본문이 오기도 한다
    throw new Error(`KAMIS 응답을 파싱할 수 없습니다: ${body.slice(0, 120)}`);
  }
  const code = json?.data?.error_code;
  if (code && code !== '000') throw new Error(`KAMIS error_code=${code}`);
  return Array.isArray(json?.data?.item) ? json.data.item : [];
}

/**
 * 하루치 전 분류를 받아 조회용 인덱스로 만든다.
 * 같은 item_name 에 부위·품종(kind_name)이 여러 개 있으므로 배열로 들고 있는다.
 */
export async function fetchIndex(date = new Date(Date.now() - 86400000)) {
  const regday = yyyymmdd(date);
  const index = new Map(); // item_name → rows[]
  const errors = [];

  const results = await Promise.all(
    Object.keys(CATEGORIES).map(async (cat) => {
      try {
        return { cat, items: await fetchCategory(cat, regday) };
      } catch (e) {
        errors.push(`${CATEGORIES[cat]}: ${e.message}`);
        return { cat, items: [] };
      }
    })
  );

  for (const { cat, items } of results) {
    for (const it of items) {
      const price = priceToNumber(it.dpr1);
      const unit = parseUnit(it.unit);
      if (price == null || !unit) continue;
      const row = {
        itemName: it.item_name,
        itemCode: it.item_code,
        kindName: it.kind_name,
        rank: it.rank,
        category: CATEGORIES[cat],
        unitRaw: it.unit,
        base: unit.base, // 'g' | 'ml' | 'count'
        // 단위당 가격 — base 가 count 면 "1개당 가격"이라 재료별 중량이 더 필요하다
        unitPrice: price / unit.size,
        countUnit: unit.countUnit || null,
        asOf: regday,
      };
      if (!index.has(row.itemName)) index.set(row.itemName, []);
      index.get(row.itemName).push(row);
    }
  }
  return { regday, index, errors, rowCount: [...index.values()].reduce((a, b) => a + b.length, 0) };
}

/**
 * 가장 최근에 데이터가 있는 날짜를 찾는다.
 * 주말·공휴일에는 조사값이 없어 빈 응답이 오므로 며칠 거슬러 올라간다.
 */
export async function fetchLatestIndex({ maxBack = 7 } = {}) {
  let last = null;
  for (let i = 1; i <= maxBack; i++) {
    const d = new Date(Date.now() - i * 86400000);
    const r = await fetchIndex(d);
    if (r.rowCount > 0) return r;
    last = r;
  }
  return last;
}
