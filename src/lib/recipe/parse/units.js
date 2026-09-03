// 조리 단위 → g/ml 환산.
// 기획서 8절 "단위 환산 문제"에 대응하는 테이블. 두 층으로 나뉜다.
//   1) 부피/무게 고정 단위 (스푼, 컵, ml, g …) — 재료와 무관하게 환산 가능
//   2) 셈 단위 (개, 대, 모, 알 …) — 재료별 표준 중량이 있어야만 환산 가능

export const VOLUME_UNITS = {
  ml: 1,
  mL: 1,
  cc: 1,
  l: 1000,
  L: 1000,
  리터: 1000,
  큰술: 15,
  스푼: 15,
  숟가락: 15,
  T: 15,
  Ts: 15,
  작은술: 5,
  찻숟가락: 5,
  t: 5,
  컵: 200,
  종이컵: 180,
  소주잔: 50,
  밥숟가락: 12,
  국자: 100,
  밥그릇: 300,
  공기: 300,
};

export const MASS_UNITS = { g: 1, G: 1, kg: 1000, KG: 1000, 그램: 1, 킬로: 1000, 근: 600 };

// 셈 단위: 재료별 1단위당 g. 없으면 환산 불가로 표시하고 사용자에게 물어본다.
// (값은 조리 상식 기준의 seed. 실제 서비스에서는 재료 마스터 DB로 옮겨야 함)
export const COUNT_WEIGHTS = {
  '양파:개': 200,
  '감자:개': 150,
  '당근:개': 200,
  '당근:약간': 60,
  '달걀:개': 55,
  '달걀:알': 55,
  '계란:개': 55,
  '계란:알': 55,
  '두부:모': 300,
  '두부:반모': 150,
  '대파:대': 100,
  '대파:뿌리': 100,
  '쪽파:줌': 50,
  '마늘:쪽': 5,
  '대파:쪽': 100,
  '다진마늘:개': 5,
  '다진마늘:쪽': 5,
  '다진 마늘:개': 5,
  '마늘:개': 5,
  '청양고추:개': 10,
  '고추:개': 10,
  '애호박:개': 250,
  '표고버섯:개': 20,
  '목이버섯:개': 5,
  '어묵:장': 40,
  '김:장': 2,
  '떡:줌': 100,
  '당면:줌': 100,
  '시금치:줌': 80,
  '닭:마리': 1000,
  '배추:포기': 2000,
  '김치:포기': 2000,
  '양배추:통': 1000,
  '무:개': 1000,
  '코인육수:개': 4,
  '코인육수:알': 4,
  '라면사리:개': 110,
  '소시지:개': 30,
  '베이컨:장': 20,
  '치즈:장': 18,
  '홍고추:개': 10,
  '풋고추:개': 12,
  '파프리카:개': 180,
  '청경채:포기': 80,
  '알배추:포기': 700,
  '느타리버섯:줌': 70,
  '팽이버섯:봉지': 150,
  '숙주:줌': 70,
  '부추:줌': 50,
  '고구마:개': 200,
  '가지:개': 150,
  '오이:개': 200,
  '토마토:개': 180,
  '레몬:개': 100,
  '떡국떡:줌': 100,
  '삼겹살:근': 600,
  '새송이버섯:개': 60,
  '깻잎:장': 2,
  '만두:개': 30,
  '유부:장': 8,
  '건고추:개': 3,
  '무:토막': 300,
  '배:개': 400,
  '사과:개': 250,
  '스팸:캔': 200,
  '스팸:통': 200,
  '소주:병': 360,
  '소주:잔': 50,
  '즉석밥:개': 210,
  '즉석밥:봉': 210,
  '참치캔:캔': 150,
  '참치캔:개': 150,
  '슬라이스치즈:장': 18,
  '베이컨:줄': 20,
  '우유:팩': 900,
};

// 위 테이블에 없더라도, 재료명 끝소리로 대략 유추할 수 있는 것들 (마지막 폴백)
export const COUNT_FALLBACK = {
  버섯: { 개: 20, 줌: 70 },
  고추: { 개: 10 },
  파: { 대: 100, 뿌리: 100 },
};

export const VAGUE_UNITS = new Set(['약간', '적당량', '조금', '취향껏', '넉넉히', '한꼬집', '꼬집']);

const KOR_NUM = {
  반: 0.5,
  한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일곱: 7, 여덟: 8, 아홉: 9, 열: 10,
  하나: 1, 둘: 2, 셋: 3, 넷: 4,
};

const VULGAR = { '½': 0.5, '⅓': 1 / 3, '¼': 0.25, '⅔': 2 / 3, '¾': 0.75, '⅕': 0.2 };

export function parseQuantity(raw) {
  if (!raw) return null;
  let s = String(raw).trim();
  for (const [ch, v] of Object.entries(VULGAR)) {
    if (s === ch) return v;
    if (s.endsWith(ch)) return (Number(s.slice(0, -1)) || 0) + v;
  }
  if (KOR_NUM[s] != null) return KOR_NUM[s];
  // "1/2", "1과 1/2"
  const mixed = /^(\d+)\s*(?:과|and)?\s+(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
  const frac = /^(\d+)\s*\/\s*(\d+)$/.exec(s);
  if (frac) return Number(frac[1]) / Number(frac[2]);
  // "2~3" 같은 범위는 중앙값
  const range = /^(\d+(?:\.\d+)?)\s*[~-]\s*(\d+(?:\.\d+)?)$/.exec(s);
  if (range) return (Number(range[1]) + Number(range[2])) / 2;
  const num = Number(s.replace(/,/g, ''));
  return Number.isFinite(num) ? num : null;
}

export function normalizeUnit(unit) {
  if (!unit) return null;
  const u = unit.trim();
  const alias = {
    큰술: '큰술', 큰스푼: '큰술', 밥숟가락: '밥숟가락', 스푼: '스푼', 숟갈: '스푼', 숟가락: '숟가락',
    작은술: '작은술', 티스푼: '작은술', 티스푼분량: '작은술',
    밀리리터: 'ml', ML: 'ml', Ml: 'ml', mL: 'ml',
    킬로그램: 'kg', 그람: 'g',
  };
  return alias[u] || u;
}

/**
 * 수량 + 단위 + 재료명 → { grams | ml, basis } 환산.
 * 환산 불가면 { convertible:false, reason } 를 돌려준다. (UI에서 "확인 필요" 배지로 노출)
 */
export function toBaseAmount(qty, unit, ingredientName) {
  const u = normalizeUnit(unit);
  if (u && MASS_UNITS[u] != null && qty != null) {
    return { convertible: true, amount: qty * MASS_UNITS[u], base: 'g', basis: `${qty}${u} → 무게 단위 직접 사용` };
  }
  if (u && VOLUME_UNITS[u] != null && qty != null) {
    const ml = qty * VOLUME_UNITS[u];
    return {
      convertible: true,
      amount: ml,
      base: 'ml',
      basis: `${u} 1단위 = ${VOLUME_UNITS[u]}ml 기준`,
    };
  }
  // 꼬집은 약간·적당량과 달리 준표준 계량(엄지+검지 ≈ 0.5g)이라 근사한다.
  // 대상이 소금·후추류라 금액 영향은 1원 미만이고, "확인 필요" 노이즈를 없애는 게 목적.
  if (u && (u === '꼬집' || u === '한꼬집') && qty != null) {
    return { convertible: true, amount: qty * 0.5, base: 'g', basis: '1꼬집 ≈ 0.5g 추정', approximate: true };
  }
  if (u && qty != null) {
    const key = `${ingredientName}:${u}`;
    if (COUNT_WEIGHTS[key] != null) {
      return {
        convertible: true,
        amount: qty * COUNT_WEIGHTS[key],
        base: 'g',
        basis: `${ingredientName} 1${u} ≈ ${COUNT_WEIGHTS[key]}g 기준`,
      };
    }
    // 재료명이 "돼지고기 앞다리살"처럼 길면 앞 토큰으로 한 번 더 시도
    const head = ingredientName?.split(/\s+/)[0];
    if (head && COUNT_WEIGHTS[`${head}:${u}`] != null) {
      return {
        convertible: true,
        amount: qty * COUNT_WEIGHTS[`${head}:${u}`],
        base: 'g',
        basis: `${head} 1${u} ≈ ${COUNT_WEIGHTS[`${head}:${u}`]}g 기준`,
      };
    }
    // 끝소리 기반 폴백 (예: "새송이버섯 2개" → 버섯:개)
    for (const [suffix, table] of Object.entries(COUNT_FALLBACK)) {
      if (ingredientName?.endsWith(suffix) && table[u] != null) {
        return {
          convertible: true,
          amount: qty * table[u],
          base: 'g',
          basis: `'${suffix}' 계열 1${u} ≈ ${table[u]}g 추정`,
          approximate: true,
        };
      }
    }
    return { convertible: false, reason: 'UNKNOWN_COUNT_UNIT', detail: `'${u}' 단위의 표준 중량 정보 없음` };
  }
  if (u && VAGUE_UNITS.has(u)) {
    return { convertible: false, reason: 'VAGUE', detail: `'${u}'은 계량값이 아님` };
  }
  return { convertible: false, reason: 'NO_QUANTITY', detail: '수량 표기 없음' };
}
