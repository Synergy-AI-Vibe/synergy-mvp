// 한국어 레시피 텍스트 → 재료 목록.
// 유튜브 설명란/블로그 본문 모두 같은 파이프라인을 타되, 다음 3가지 방식으로 재료 구간을 찾는다.
//   A. 헤더 블록  : "재료" 헤더 다음 줄부터 재료가 한 줄씩
//   B. 헤더 인라인: "재료 : 돼지고기, 물 550ml, 김치" 처럼 한 줄에 쉼표로 나열
//   C. 밀도 탐지  : 헤더가 아예 없고 재료처럼 생긴 줄이 연속으로 나오는 구간 (네이버 블로그에 흔함)
import { parseQuantity, normalizeUnit, toBaseAmount, VAGUE_UNITS } from './units.js';

const UNIT_WORDS = [
  'kg', 'KG', 'g', 'G', 'mL', 'ml', 'ML', 'L', 'l', 'cc', 'CC',
  '큰술', '작은술', '찻숟가락', '숟가락', '숟갈', '스푼', '컵', '종이컵', '소주잔', '국자',
  '개', '알', '장', '대', '쪽', '모', '줌', '봉지', '봉', '포기', '통', '마리', '조각',
  '밥그릇', '공기', '번', '근', '뿌리', '단', '인분', '꼬집', '팩', '캔', '병', '자루', '토막', '주먹',
  'T', 't', 'Ts',
];
const UNIT_ALT = UNIT_WORDS.slice().sort((a, b) => b.length - a.length).join('|');
// 아라비아 숫자는 단위가 없어도 수량으로 인정하지만,
// 한글 수사(한/두/세…)는 단위가 붙어야만 수량으로 본다. ("최대한 고운 고추가루"의 '한' 오인 방지)
const NUM_DIGIT = String.raw`\d+(?:[.,]\d+)?(?:\s*\/\s*\d+)?(?:\s*[~\-]\s*\d+(?:[.,]\d+)?)?|[½⅓¼⅔¾⅕]`;
const NUM_KOR = String.raw`반|한|두|세|네|다섯|여섯|일곱|여덟|아홉|열`;
const NUM = `${NUM_DIGIT}|${NUM_KOR}`;

// 수량 뒤에 붙는 군더더기 ("1/3개씩", "400g 정도")까지 함께 먹는다.
const QTY_TAIL = String.raw`(?:씩|정도|쯤|가량)?`;
const QTY_RE = new RegExp(
  String.raw`(${NUM_DIGIT})\s*(${UNIT_ALT})?${QTY_TAIL}(?![가-힣A-Za-z])|(${NUM_KOR})\s*(${UNIT_ALT})${QTY_TAIL}(?![가-힣A-Za-z])`,
  'g'
);
const VAGUE_RE = /(약간|적당량|조금|취향껏|넉넉히|한꼬집)/;
// 서술형 문장 판별. 재료 줄에는 거의 나오지 않는 어미들.
const NARRATIVE_RE =
  /(니다|했어요|하세요|해요|이에요|예요|드세요|주세요|볼게요|더라구요|더라고요|거예요|겠어요|네요|이지요|되지요|해도|하면|하고|이라면|처럼|보세요|추천)/;
const NAME_TRIM_RE = /(정도|쯤|가량|수북하게|넉넉히|취향껏|남짓|계량)/g;

const HEADER_RE =
  /^[\s\-–—*■◆●▶※#♥❤🥘🧾📌|[\](){}=~_.]*\s*(?:[가-힣A-Za-z0-9]{1,12}\s+){0,3}(주재료|부재료|재료|양념장|양념재료|양념|소스|밑간|육수|고명|준비물|준비\s?재료|들어가는\s?재료|ingredients?)(?![가-힣])\s*[\]|)]*\s*[:：\-–—]?\s*(.*)$/i;

const STEP_RE = /^\s*(?:[①-⑳]|\d+\s*[.)]|step\s*\d+)\s*/i;
const STEP_HEADER_RE = /(만드는\s?법|만드는\s?방법|조리\s?법|조리\s?순서|레시피\s?순서|조리\s?과정|끓이는\s?법|요리\s?순서|how\s?to)/i;

// 재료 줄로 볼 수 없는 것들
const NOISE_RE =
  /(https?:\/\/|www\.|@|구독|좋아요|알림\s?설정|인스타|instagram|블로그\s?주소|문의|협찬|비즈니스|저작권|©|채널|영상|댓글|자막|sub|자세한|계량\s?(?:컵|스푼|법|기준)|기준입니다|참고하세요|1T\s*=|1t\s*=|촬영|편집|음악|music|BGM)/i;

const NAME_STOPWORDS = new Set([
  '재료', '주재료', '부재료', '양념', '양념장', '소스', '밑간', '육수', '고명', '준비물', '팁', 'tip',
  '총', '합계', '계량', '기준', '분량', '인분', '레시피', '조리', '완성', '이상', '끝', '사진', '영상',
]);

// '/' 는 분수(1/5)와 충돌하므로 기본 구분자에서 제외한다.
export function splitTopLevel(s, seps = [',', '·', '、', '+']) {
  const out = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if ('([{（['.includes(ch)) depth++;
    else if (')]}）]'.includes(ch)) depth = Math.max(0, depth - 1);
    if (depth === 0 && seps.includes(ch)) {
      out.push(cur);
      cur = '';
    } else cur += ch;
  }
  out.push(cur);
  return out.map((x) => x.trim()).filter(Boolean);
}

function cleanLine(line) {
  return line
    .replace(/^[\s\-–—*•·▶▷○●■□◆◇★☆✔✅➡→#]+/, '')
    .replace(/[\s]+$/, '')
    .replace(/^[\p{Emoji_Presentation}\p{Extended_Pictographic}️‍]+/gu, '')
    .trim();
}

/** 이 줄이 "재료처럼" 생겼는가 (밀도 탐지 및 블록 종료 판정에 사용) */
export function looksLikeIngredient(line) {
  const s = cleanLine(line);
  if (!s || s.length > 40) return false;
  if (NOISE_RE.test(s)) return false;
  if (STEP_RE.test(s) || STEP_HEADER_RE.test(s)) return false;
  if (/[.!?]$/.test(s) && s.length > 15) return false;
  if (NARRATIVE_RE.test(s)) return false;
  const hasQty = new RegExp(`(?:${NUM_DIGIT})\\s*(?:${UNIT_ALT})|(?:${NUM_KOR})\\s*(?:${UNIT_ALT})`).test(s) || VAGUE_RE.test(s);
  if (!hasQty) return false;
  // 숫자만 있거나 시간/온도면 제외
  if (/^\s*\d+\s*(분|초|시간|도|℃|인분)\s*$/.test(s)) return false;
  return /[가-힣]/.test(s);
}

/** 한 개 세그먼트(쉼표로 쪼갠 한 조각) → 재료 아이템 */
export function parseSegment(seg, section) {
  let s = cleanLine(seg);
  if (!s) return null;

  // 수량 앞의 어림 표현은 지운다: "물 : 약 3컵" 의 '약' 은 '약간' 이 아니라 '대략' 이라
  // 그냥 두면 이름이 "물 약" 이 된다. 앞이 한글이면 단어 일부이므로("한약 3g") 건드리지 않는다.
  s = s.replace(/(?<![가-힣])(약|대략|얼추|한)\s+(?=[\d½⅓¼⅔¾⅕])/g, '');

  // 괄호 주석 분리: "닭(1마리-1.5kg)", "대파 1대 (100g)"
  const notes = [];
  s = s.replace(/[（(]([^)）]*)[)）]/g, (_, inner) => {
    notes.push(inner.trim());
    return ' ';
  }).replace(/\s{2,}/g, ' ').trim();

  const candidates = [];
  const collect = (text, from) => {
    QTY_RE.lastIndex = 0;
    let m;
    while ((m = QTY_RE.exec(text))) {
      const rawQty = m[1] ?? m[3];
      const rawUnit = m[1] != null ? m[2] : m[4];
      const qty = parseQuantity(rawQty);
      if (qty == null) continue;
      candidates.push({ qty, unit: normalizeUnit(rawUnit || null), from, index: m.index, len: m[0].length });
    }
  };
  collect(s, 'main');
  for (const n of notes) collect(n, 'note');

  // 이름 = 본문에서 수량 토큰과 계량 수식어를 걷어낸 나머지
  let name = s;
  for (const c of candidates.filter((x) => x.from === 'main').sort((a, b) => b.index - a.index)) {
    name = name.slice(0, c.index) + ' ' + name.slice(c.index + c.len);
  }
  name = name
    .replace(VAGUE_RE, ' ')
    .replace(NAME_TRIM_RE, ' ')
    .replace(/[:：\-–—=+|]+/g, ' ')
    .replace(/[!?~.,·]+/g, ' ')
    .replace(/^의\s+/, '') // "약간의 소금" → "소금"
    .replace(/\s{2,}/g, ' ')
    .trim();

  if (!name || NAME_STOPWORDS.has(name) || !/[가-힣A-Za-z]/.test(name)) return null;
  if (NOISE_RE.test(name)) return null;
  if (name.length > 25) return null;

  // 무게/부피 단위가 붙은 수량을 최우선으로 채택 (예: "어묵 3장 120g" → 120g)
  const rank = (c) => {
    if (!c.unit) return 0;
    if (/^(kg|g|ml|mL|L|l|cc)$/i.test(c.unit)) return 3;
    return 2;
  };
  const chosen = candidates.slice().sort((a, b) => rank(b) - rank(a) || a.index - b.index)[0] || null;
  const vague = VAGUE_RE.exec(s)?.[1] || null;
  let unit = chosen?.unit ?? (vague ? vague : null);

  // "김치 밥그릇 1번" 처럼 단위가 이름 쪽에 붙어 버린 경우 되찾아온다.
  if (chosen?.qty != null && (!unit || unit === '번')) {
    // 공백으로 분리된 경우만. ("진간장" 의 '장'을 단위로 떼어내면 안 된다)
    const m = new RegExp(`^(.+?)\\s+(${UNIT_ALT})$`).exec(name);
    if (m && m[1].trim()) {
      name = m[1].trim();
      unit = m[2];
    }
  }

  const item = {
    raw: seg.trim(),
    section,
    name,
    qty: chosen?.qty ?? null,
    unit,
    notes: notes.length ? notes : undefined,
    alternates: candidates.length > 1 ? candidates.map((c) => `${c.qty}${c.unit || ''}`) : undefined,
  };

  const conv = toBaseAmount(item.qty, item.unit, item.name);
  item.amount = conv.convertible ? { value: Math.round(conv.amount * 100) / 100, base: conv.base, basis: conv.basis } : null;
  item.amountIssue = conv.convertible ? null : { reason: conv.reason, detail: conv.detail };

  if (item.qty != null && item.unit && /^(kg|g|ml|mL|L|l|cc)$/i.test(item.unit)) item.confidence = 'high';
  else if (item.qty != null && conv.convertible) item.confidence = 'high';
  else if (item.qty != null) item.confidence = 'medium';
  else if (vague && VAGUE_UNITS.has(vague)) item.confidence = 'low';
  else item.confidence = 'low';

  return item;
}

// "닭(1마리-1.5kg), 감자(2개), 양파(1/2개)…" 처럼 한 줄에 쉼표로 죽 나열된 형태.
// 길이 제한에 걸려 looksLikeIngredient 를 통과하지 못하므로 별도로 판정한다.
function tryInlineList(s, section) {
  if (NOISE_RE.test(s) || STEP_RE.test(s) || STEP_HEADER_RE.test(s)) return null;
  if (NARRATIVE_RE.test(s)) return null;
  if (splitTopLevel(s).length < 2) return null;
  const got = parseLine(s, section);
  if (got.length >= 2 && got.filter((i) => i.qty != null).length >= 1) return got;
  return null;
}

// "- 시금치 간하기 : 다진마늘 1/3스푼, 가는소금 약간" 처럼
// 사전에 정의할 수 없는 이름의 소제목이 붙은 인라인 목록.
const LABELED_RE = /^[\s\-–—*•·▶>]*([^:：]{1,16})[:：]\s*(.+)$/;
function tryLabeledInline(s) {
  if (NOISE_RE.test(s) || NARRATIVE_RE.test(s) || STEP_RE.test(s) || STEP_HEADER_RE.test(s)) return null;
  const m = LABELED_RE.exec(s);
  if (!m) return null;
  const label = m[1].trim().replace(/^[|[\](){}]+|[|[\](){}]+$/g, '');
  if (!label || !/[가-힣]/.test(label)) return null;
  const got = parseLine(m[2].trim(), label);
  if (got.length >= 2 && got.filter((i) => i.qty != null).length >= 1) return { section: label, items: got };
  // 항목이 하나뿐이면("당면 삶기 : 들기름 2스푼") 계량 단위까지 확실할 때만 인정한다.
  // "팁 : 2인분" 처럼 환산되지 않는 수량은 여기서 걸러진다.
  if (got.length === 1 && got[0].confidence === 'high' && got[0].amount) return { section: label, items: got };
  return null;
}

function parseLine(line, section) {
  const segs = splitTopLevel(line);
  const out = [];
  for (const seg of segs) {
    const it = parseSegment(seg, section);
    if (it) out.push(it);
  }
  return out;
}

export function extractIngredients(text, { source = 'unknown' } = {}) {
  const lines = String(text || '').split(/\r?\n/);
  const items = [];
  const usedLines = new Set();
  const methods = new Set();
  const sections = [];

  // --- A/B. 헤더 기반 ---
  for (let i = 0; i < lines.length; i++) {
    const h = HEADER_RE.exec(lines[i].trim());
    if (!h) continue;
    if (NOISE_RE.test(lines[i])) continue;
    if (NARRATIVE_RE.test(lines[i])) continue; // "매운 양념장 소스도 맛있지만, …" 같은 서술문
    const section = h[1].replace(/\s+/g, '');
    const inline = (h[2] || '').trim();

    if (inline && /[가-힣]/.test(inline) && !STEP_HEADER_RE.test(inline)) {
      const got = parseLine(inline, section);
      // "재료 준비" 같은 소제목이 인라인 목록으로 오인되지 않도록,
      // 항목이 2개 이상이거나 최소한 수량이 붙어 있어야 인정한다.
      if (got.length >= 2 || (got.length === 1 && got[0].qty != null)) {
        methods.add('header-inline');
        sections.push({ section, line: i, mode: 'inline', count: got.length });
        items.push(...got);
        usedLines.add(i);
        continue;
      }
    }

    // 블록 모드: 헤더 다음 줄부터 소비
    let miss = 0;
    let blockCount = 0;
    const consumed = [];
    for (let j = i + 1; j < lines.length && j < i + 60; j++) {
      const raw = lines[j];
      const s = raw.trim();
      if (!s) {
        if (blockCount > 0 && miss > 0) break;
        continue;
      }
      if (STEP_RE.test(s) || STEP_HEADER_RE.test(s)) break;
      if (HEADER_RE.test(s)) break; // 다음 섹션 헤더는 바깥 루프가 처리
      if (looksLikeIngredient(s)) {
        miss = 0;
        const got = parseLine(s, section);
        if (got.length) {
          consumed.push(...got);
          usedLines.add(j);
          blockCount++;
        }
        continue;
      }
      // "(흰설탕 대체 가능)" 같은 괄호 주석 줄은 재료 블록을 끊지 않는다.
      if (/^[（(].*[)）]$/.test(s)) continue;
      const inlineGot = tryInlineList(s, section);
      if (inlineGot) {
        miss = 0;
        consumed.push(...inlineGot);
        usedLines.add(j);
        blockCount++;
        continue;
      }
      // 재료처럼 안 생긴 줄: 수량 없는 재료명 단독일 수도 있다 ("식용유")
      if (blockCount > 0 && s.length <= 12 && /^[가-힣][가-힣\s]*$/.test(s) && !NOISE_RE.test(s) && miss === 0) {
        const got = parseLine(s, section);
        if (got.length) {
          consumed.push(...got);
          usedLines.add(j);
          blockCount++;
          continue;
        }
      }
      miss++;
      if (miss >= 1) break;
    }
    if (consumed.length) {
      methods.add('header-block');
      sections.push({ section, line: i, mode: 'block', count: consumed.length });
      items.push(...consumed);
      usedLines.add(i);
    }
  }

  // --- B-2. 임의 이름의 소제목이 붙은 인라인 목록 (헤더 사전에 없는 섹션) ---
  for (let i = 0; i < lines.length; i++) {
    if (usedLines.has(i)) continue;
    const hit = tryLabeledInline(lines[i].trim());
    if (!hit) continue;
    methods.add('labeled-inline');
    sections.push({ section: hit.section, line: i, mode: 'labeled-inline', count: hit.items.length });
    items.push(...hit.items);
    usedLines.add(i);
  }

  // --- C. 밀도 탐지 (헤더가 없는 블로그 대응) ---
  // 헤더 블록이 '양념' 한 섹션만 잡아도 items >= 3 이 되는 바람에, 헤더 없는 본
  // 재료 목록이 통째로 누락되던 문제가 있었다(홀드아웃 오징어볶음 건).
  // usedLines 로 이미 소비한 줄은 건너뛰므로 게이트 없이 항상 훑는다.
  {
    // C-1. 헤더 없이 한 줄에 쉼표로 죽 나열한 경우
    // ("불고깃감 소고기 500g, 대파 1대, 양파 3/4개(약 150g), 표고버섯 2개, 깨")
    for (let i = 0; i < lines.length; i++) {
      if (usedLines.has(i)) continue;
      const s = lines[i].trim();
      if (s.length < 12) continue;
      const got = tryInlineList(s, '본문');
      // 영문 번역 블록("Eng sub / Ingredients: pork, water, kimchi …")이 한국어
      // 재료 목록과 중복 검출되던 문제. 헤더 없이 훑는 이 경로에서는 한국어
      // 재료명이 과반인 줄만 인정한다.
      const korean = got ? got.filter((x) => /[가-힣]/.test(x.name)).length : 0;
      if (got && got.length >= 3 && got.filter((x) => x.qty != null).length >= 2 && korean * 2 > got.length) {
        methods.add('inline-density');
        sections.push({ section: '본문', line: i, mode: 'inline-density', count: got.length });
        items.push(...got);
        usedLines.add(i);
      }
    }
  }

  // C-2. 재료처럼 생긴 줄이 연속으로 나오는 구간
  {
    let run = [];
    const flush = () => {
      // 3줄짜리 목록도 인정한다. 수량 없는 재료 줄("카레용 삼겹살")이 중간에
      // 끼면 런이 둘로 쪼개지는데, 4줄을 요구하면 양쪽 다 버려졌다.
      if (run.length >= 3) {
        const got = run.flatMap((j) => parseLine(lines[j].trim(), '본문'));
        if (got.length >= 3) {
          methods.add('density');
          sections.push({ section: '본문', line: run[0], mode: 'density', count: got.length });
          items.push(...got);
          run.forEach((j) => usedLines.add(j));
        }
      }
      run = [];
    };
    for (let i = 0; i < lines.length; i++) {
      const s = lines[i].trim();
      if (!s) continue; // 블로그는 문단마다 빈 줄이 섞인다
      if (usedLines.has(i)) { flush(); continue; }
      if (looksLikeIngredient(s)) run.push(i);
      else flush();
    }
    flush();
  }

  // 중복 제거 (같은 이름 + 같은 수량)
  const seen = new Map();
  const deduped = [];
  for (const it of items) {
    const key = `${it.name}|${it.qty}|${it.unit}`;
    if (seen.has(key)) continue;
    seen.set(key, true);
    deduped.push(it);
  }

  const method = deduped.length === 0 ? 'none' : [...methods].join('+');
  return {
    source,
    method,
    sections,
    items: deduped,
    diagnostics: {
      lineCount: lines.length,
      hasHeader: methods.has('header-block') || methods.has('header-inline'),
      counts: {
        total: deduped.length,
        high: deduped.filter((i) => i.confidence === 'high').length,
        medium: deduped.filter((i) => i.confidence === 'medium').length,
        low: deduped.filter((i) => i.confidence === 'low').length,
        unconvertible: deduped.filter((i) => !i.amount).length,
      },
    },
  };
}
