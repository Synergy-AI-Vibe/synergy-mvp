// 본문에 선언된 계량 기준을 찾아 기본 환산표(units.js)보다 우선 적용한다.
//
// 유튜브 설명란에는 종종 그 영상만의 계량 기준이 적혀 있다:
//   "1T = 15ml 계량스푼 기준입니다"
//   "계량은 밥숟가락(10g) 기준"
//   "1컵은 180ml 종이컵을 썼어요"
// 이런 줄은 NOISE_RE 가 재료 파싱에서는 걸러내지만(맞는 동작), 담긴 정보 자체는
// 환산표 기본값(큰술 15ml 등)보다 정확하다 — 그 영상의 실제 계량이기 때문이다.
//
// 오인 방지 원칙:
//   · "다진마늘 1큰술(10g)" 같은 재료 줄의 병기는 선언이 아니다 → 그 재료에만 적용되고
//     (ingredients.js 의 rank 로직) 전역 기준으로 삼지 않는다.
//   · 그래서 단위와 값 사이에 명시적 연결(= : 또는 '기준'/'계량' 문맥의 은/는·괄호)이
//     있을 때만 선언으로 인정한다.

import { normalizeUnit } from './units.js';

// 선언 대상은 "사람마다 다른" 계량 단위뿐이다. g/ml 자체나 셈 단위(개·모)는 제외.
const BASIS_UNITS = 'Ts|T|t|큰스푼|큰술|작은술|티스푼|찻숟가락|밥숟가락|숟가락|숟갈|스푼|종이컵|컵|국자';
const NUMV = String.raw`\d+(?:\.\d+)?`;
const BASE = String.raw`kg|g|ml|cc|L|l`;

// "1큰술 = 15g" · "1T:15ml" — 연결 기호가 있으면 그 자체로 선언
const DECL_EQ = new RegExp(
  String.raw`(?:1\s*)?(${BASIS_UNITS})\s*[=:：]\s*(?:약\s*)?(${NUMV})\s*(${BASE})(?![a-zA-Z가-힣])`,
  'g'
);
// "1큰술은 15g" · "밥숟가락(10g) 기준" — 은/는·괄호 연결은 계량/기준 문맥이 있는 줄에서만
const DECL_SOFT = new RegExp(
  String.raw`(?:1\s*)?(${BASIS_UNITS})\s*(?:은|는|[(（])\s*(?:약\s*)?(${NUMV})\s*(${BASE})\s*[)）]?(?![a-zA-Z가-힣])`,
  'g'
);
const CONTEXT_RE = /계량|기준/;

// 선언은 "해당하는 단위"에만 적용한다.
// 묶는 것은 환산표(units.js) 기본값이 같아 사실상 동의어인 단위뿐이다 (큰술=스푼=숟가락=T=15ml).
// 밥숟가락(12)·컵(200)·종이컵(180)처럼 기본값이 다른 단위는 별개의 계량이므로,
// 선언된 그 단위의 재료만 바뀌고 나머지는 하드코딩 환산표를 그대로 탄다.
const GROUPS = [
  ['큰술', '스푼', '숟가락', 'T', 'Ts'],
  ['작은술', '찻숟가락', 't'],
  ['밥숟가락'],
  ['컵'],
  ['종이컵'],
  ['국자'],
];

function toBaseValue(value, baseUnit) {
  const v = Number(value);
  switch (baseUnit) {
    case 'kg': return { value: v * 1000, base: 'g' };
    case 'g': return { value: v, base: 'g' };
    case 'L':
    case 'l': return { value: v * 1000, base: 'ml' };
    default: return { value: v, base: 'ml' }; // ml · cc
  }
}

/**
 * 본문 전체에서 계량 기준 선언을 찾는다.
 * @returns {Map<string, {value:number, base:'g'|'ml', declared:string}>} 정규화 단위 → 기준
 */
export function detectMeasureBasis(text) {
  const map = new Map();
  for (const line of String(text || '').split(/\r?\n/)) {
    const found = [];
    DECL_EQ.lastIndex = 0;
    let m;
    while ((m = DECL_EQ.exec(line))) found.push(m);
    if (CONTEXT_RE.test(line)) {
      DECL_SOFT.lastIndex = 0;
      while ((m = DECL_SOFT.exec(line))) found.push(m);
    }
    for (const [, rawUnit, num, baseUnit] of found) {
      const unit = normalizeUnit(rawUnit);
      const { value, base } = toBaseValue(num, baseUnit);
      if (!Number.isFinite(value) || value <= 0 || value > 1000) continue; // "1컵 = 5000g" 같은 오탐 방어
      const decl = { value, base, declared: `1${unit} = ${value}${base}` };
      const group = GROUPS.find((g) => g.includes(unit));
      for (const u of group ?? [unit]) map.set(u, decl);
    }
  }
  return map;
}

/**
 * 파싱된 재료들에 본문 계량 기준을 적용한다 (제자리 수정).
 * 원문에 g/ml 가 직접 붙은 재료는 rank 로직이 이미 그 값을 골랐으므로 여기 오지 않는다 —
 * 스푼·컵류 단위로 환산표를 탔거나 환산 실패한 재료만 다시 계산한다.
 */
export function applyMeasureBasis(items, basisMap) {
  if (!basisMap?.size) return items;
  for (const it of items) {
    if (it.qty == null || !it.unit) continue;
    const decl = basisMap.get(it.unit);
    if (!decl) continue;
    it.amount = {
      value: Math.round(it.qty * decl.value * 100) / 100,
      base: decl.base,
      basis: `본문 계량 기준 적용 (${decl.declared})`,
    };
    it.amountIssue = null;
    it.confidence = 'high';
  }
  return items;
}
