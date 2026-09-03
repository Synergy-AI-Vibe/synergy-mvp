// 우리 표준 품목명 → KAMIS 조회 규칙.
//
// KAMIS 는 한 item_name 안에 부위·품종·등급이 여러 행으로 들어 있어서
// (돼지 = 앞다리/삼겹살/갈비/목심, 소 = 안심/등심/설도… × 1++~1등급)
// 어느 행을 쓸지 정해 줘야 한다. 실제 응답을 보고 고른 값들이다.
//
//  item        : KAMIS item_name (정확히 일치)
//  kind        : kind_name 선택 정규식 (없으면 첫 행)
//  rank        : rank 선택 정규식 (없으면 '상품' → 아무거나 순으로 시도)
//  countWeight : unit 이 셈 단위(1개·10구 등)일 때 1단위당 g
//  byRawName   : 원문 재료명으로 부위를 더 좁히고 싶을 때 (앞에서부터 첫 매치)
export const KAMIS_MAP = {
  돼지고기: {
    item: '돼지',
    kind: /앞다리/,
    byRawName: [
      [/삼겹/, /삼겹살/],
      [/목살|목심/, /목심/],
      [/갈비/, /갈비/],
      [/앞다리|전지|제육|카레용/, /앞다리/],
    ],
  },
  소고기: { item: '소', kind: /등심/, rank: /1등급/, byRawName: [[/양지|차돌/, /양지/], [/안심/, /안심/], [/설도|불고기/, /설도/]] },
  차돌박이: { item: '소', kind: /양지/, rank: /1등급/ },
  닭: { item: '닭', kind: /육계/ },
  달걀: { item: '계란', kind: /특란10구/, countWeight: 55 },

  양파: { item: '양파' },
  감자: { item: '감자', kind: /수미/ },
  당근: { item: '당근' },
  대파: { item: '파', kind: /대파/ },
  애호박: { item: '호박', kind: /애호박/, countWeight: 250 },
  청양고추: { item: '풋고추', kind: /청양고추/ },
  홍고추: { item: '붉은고추' },
  마늘: { item: '깐마늘(국산)' },
  시금치: { item: '시금치' },
  파프리카: { item: '파프리카' },
  배추: { item: '배추', countWeight: 2000 },
  오이: { item: '오이', countWeight: 200 },
  무: { item: '무', countWeight: 1000 },
  깻잎: { item: '깻잎' },
  부추: { item: '부추' },
  생강: { item: '생강' },
  고춧가루: { item: '고춧가루', kind: /국산/ },
  쌀: { item: '쌀' },
  고구마: { item: '고구마' },

  소금: { item: '천일염' },
  멸치액젓: { item: '멸치액젓' },
  통깨: { item: '참깨' },
  우유: { item: '우유', kind: /흰우유/ },

  물오징어: { item: '물오징어', countWeight: 300 },
  바지락: { item: '바지락' },
  새우젓: { item: '새우젓' },
  토마토: { item: '토마토', countWeight: 180 },
  상추: { item: '상추', kind: /청/ },
  양배추: { item: '양배추', countWeight: 1000 },
  브로콜리: { item: '브로콜리', countWeight: 300 },
  마른미역: { item: '마른미역' },
  김: { item: '김', kind: /마른김/, countWeight: 2 },

  느타리버섯: { item: '느타리버섯', kind: /^느타리버섯/ },
  팽이버섯: { item: '팽이버섯' },
  새송이버섯: { item: '새송이버섯' },
};

/** index(Map: item_name → rows[]) 에서 규칙에 맞는 한 행을 고른다. */
export function selectRow(index, spec, rawName = '') {
  const rows = index.get(spec.item) || [];
  if (!rows.length) return null;

  // 원문 재료명으로 부위를 좁힐 수 있으면 우선 적용
  let kind = spec.kind;
  for (const [namePattern, kindPattern] of spec.byRawName || []) {
    if (namePattern.test(rawName)) {
      kind = kindPattern;
      break;
    }
  }

  let candidates = kind ? rows.filter((r) => kind.test(r.kindName)) : rows;
  if (!candidates.length) candidates = rows;

  if (spec.rank) {
    const byRank = candidates.filter((r) => spec.rank.test(r.rank));
    if (byRank.length) candidates = byRank;
  } else {
    // 등급 표기가 있으면 '상품' 을 기본으로 (없으면 그대로)
    const good = candidates.filter((r) => /상품/.test(r.rank));
    if (good.length) candidates = good;
  }
  return candidates[0] || null;
}
