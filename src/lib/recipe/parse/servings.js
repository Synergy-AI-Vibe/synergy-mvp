// 원문에서 "몇 인분"을 뽑는다.
//
// 코퍼스 35건 중 인분 표기가 있는 건 10건(29%)뿐이고, 그중에도 두 종류가 섞여 있다.
//   선언형: "분량 : 2~3인분", "(2인분 기준)", "재료 3~4인분"
//   서술형: "처음에는 1인분만 만들 생각이었거든요?", "결국 2인분 되어벌임..😂"
// 서술형을 그대로 믿으면 1인분 금액이 크게 틀리므로, 문맥으로 가려낸다.

const NUM = String.raw`\d+(?:\s*[~\-–]\s*\d+)?`;
const KOR = { 한: 1, 두: 2, 세: 3, 네: 4, 다섯: 5, 여섯: 6, 일: 1, 이: 2, 삼: 3, 사: 4, 오: 5 };
const RE = new RegExp(String.raw`(${NUM}|한|두|세|네|다섯|여섯)\s*인분`, 'g');

// 앞쪽 문맥에 이런 말이 있으면 선언으로 본다
const DECLARE = /(분량|양|기준|재료|인원|서빙|serving)/;
// 같은 문장에 이런 어미·표현이 있으면 서술로 본다
const NARRATIVE = /(거든요|더라구요|더라고요|버렸|벌임|생각이었|했어요|ㅋㅋ|ㅎㅎ|😂|먹었|만들 생각)/;

function toNumber(raw) {
  const s = String(raw).replace(/\s+/g, '');
  if (KOR[s] != null) return { value: KOR[s], range: null };
  const m = /^(\d+)[~\-–](\d+)$/.exec(s);
  if (m) {
    const lo = Number(m[1]);
    const hi = Number(m[2]);
    // 범위는 중앙값을 쓰되 원문 표기를 함께 남긴다
    return { value: (lo + hi) / 2, range: [lo, hi] };
  }
  const n = Number(s);
  return Number.isFinite(n) ? { value: n, range: null } : null;
}

/**
 * @returns {{servings:number, raw:string, range:?number[], basis:string, confidence:'high'|'medium'} | null}
 */
export function detectServings(text) {
  const body = String(text || '');
  if (!body) return null;

  const candidates = [];
  RE.lastIndex = 0;
  let m;
  while ((m = RE.exec(body))) {
    const parsed = toNumber(m[1]);
    if (!parsed || parsed.value <= 0 || parsed.value > 20) continue;

    const before = body.slice(Math.max(0, m.index - 20), m.index);
    // 같은 문장 범위만 본다 (문장부호·줄바꿈으로 자름)
    const after = body.slice(m.index, m.index + 40);
    const sentence = (before + after).split(/[\n.!?]/).find((s) => s.includes('인분')) || before + after;

    let score = 0;
    if (DECLARE.test(before)) score += 3;
    if (/[(（]\s*$/.test(before) || /인분[^)）]{0,6}[)）]/.test(after)) score += 2;
    // "3~4인분 참고 수치 기준으로" 처럼 '기준'이 몇 글자 뒤에 오는 경우가 있어 창을 넉넉히 본다
    if (/기준|분량/.test(after.slice(0, 24))) score += 2;
    // "4인분 정도 되는 양인데" — 구어체지만 분량을 말하는 표현
    if (/정도\s*(되는|나오는)?\s*양/.test(after.slice(0, 20))) score += 2;
    if (NARRATIVE.test(sentence)) score -= 4;
    // 글 앞쪽일수록 선언일 가능성이 높다
    if (m.index < body.length * 0.4) score += 1;

    candidates.push({ ...parsed, raw: m[0].replace(/\s+/g, ''), index: m.index, score, sentence: sentence.trim() });
  }

  if (!candidates.length) return null;
  candidates.sort((a, b) => b.score - a.score || a.index - b.index);
  const best = candidates[0];
  if (best.score < 2) return null; // 선언이라고 볼 근거가 약하면 포기

  return {
    servings: best.value,
    raw: best.raw,
    range: best.range,
    basis: `원문 표기 "${best.raw}"`,
    confidence: best.score >= 4 ? 'high' : 'medium',
  };
}
