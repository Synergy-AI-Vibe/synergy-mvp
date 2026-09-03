// 재료명 → 표준 품목명 정규화 (LLM).
//
// 규칙 기반 ALIASES 가 못 잡는 표기 변형을 흡수하는 자리다.
// 생성이 아니라 "주어진 목록 중 하나 고르기 + 해당 없으면 null" 인 분류 문제로
// 좁혀 두는 게 핵심이다. 그래야 없는 재료를 지어내지 않는다.
import '../env.js';
import { generateJsonWithRetry } from '../llm/gemini.js';

const SYSTEM = `당신은 한국어 레시피의 재료 표기를 표준 품목명으로 매핑하는 분류기입니다.

규칙:
- 반드시 주어진 표준 품목 목록에 있는 이름 하나로만 답하거나, 해당 없으면 null 을 반환합니다.
- 목록에 없는 이름을 새로 만들어내지 마세요.
- 다음은 재료가 아니므로 반드시 canonical null + isIngredient false 입니다:
  · 조리도구·계량 표현 (밥숟가락, 종이컵, 큰 술, 1C, 계량컵, 비닐장갑)
  · 조리 단계나 문장 조각 (재료 준비, 색 비율로 적당히, 한 팩이 소포장으로…)
  · 가격·후기 문장
- 반대로, 목록에 없을 뿐인 진짜 식재료(예: 꽃게, 월계수잎)는 canonical null 이어도 isIngredient true 입니다.
- 브랜드명이 붙어 있으면 떼고 판단합니다. (예: "오뚜기 참기름" → 참기름)
- 가공 상태 수식어는 무시합니다. (예: "삶은 계란" → 달걀, "자른 미역" → 마른미역)
- 애매하면 억지로 붙이지 말고 null 을 선택하세요. 틀린 매핑은 없는 것보다 나쁩니다.
- confidence 는 0~1 로, 확신이 없으면 낮게 매깁니다.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    mappings: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          input: { type: 'STRING', description: '입력으로 준 재료 표기 그대로' },
          canonical: { type: 'STRING', nullable: true, description: '표준 품목명 또는 null' },
          isIngredient: {
            type: 'BOOLEAN',
            description: '실제 식재료면 true. 조리도구·계량 표현·조리 단계·문장 조각이면 false',
          },
          confidence: { type: 'NUMBER', description: '0~1' },
          reason: { type: 'STRING', description: '한 문장 근거' },
        },
        required: ['input', 'canonical', 'isIngredient', 'confidence'],
      },
    },
  },
  required: ['mappings'],
};

/**
 * @param {string[]} names 정규화할 재료 표기들
 * @param {string[]} canonicalNames 허용된 표준 품목명 목록 (닫힌 집합)
 * @returns {Promise<{results: Map<string, {canonical, confidence, reason}>, usage}>}
 */
export async function normalizeNames(
  names,
  canonicalNames,
  { model, minConfidence = 0.6, batchSize = 10, timeout = 180000 } = {}
) {
  const results = new Map();
  const usage = { input: 0, output: 0 };
  if (!names.length) return { results, usage };

  const allowed = new Set(canonicalNames);
  const list = canonicalNames.join(', ');

  // 한 번에 너무 많이 넣으면 응답이 길어져 타임아웃이 난다. 작게 쪼갠다.
  for (let i = 0; i < names.length; i += batchSize) {
    const batch = names.slice(i, i + batchSize);
    const user =
      `## 표준 품목 목록 (이 중에서만 고를 것)\n${list}\n\n` +
      `## 매핑할 재료 표기\n${batch.map((n, j) => `${j + 1}. ${n}`).join('\n')}`;

    const { data, usage: u } = await generateJsonWithRetry({ model, system: SYSTEM, user, schema: SCHEMA, timeout });
    usage.input += u.input;
    usage.output += u.output;

    for (const m of data?.mappings || []) {
      if (!m || typeof m.input !== 'string') continue;
      let canonical = m.canonical && String(m.canonical).trim();
      // 목록에 없는 값을 만들어냈으면 버린다 (환각 방지의 마지막 방어선)
      if (canonical && !allowed.has(canonical)) canonical = null;
      // 확신이 낮으면 붙이지 않는다
      if (canonical && Number(m.confidence) < minConfidence) canonical = null;
      results.set(m.input, {
        canonical: canonical || null,
        // 명시적으로 false 일 때만 비재료 취급 (필드 누락 시 재료로 간주 — 실수로 숨기지 않기)
        isIngredient: m.isIngredient !== false,
        confidence: Number(m.confidence) || 0,
        reason: m.reason || '',
        raw: m.canonical ?? null,
      });
    }
  }
  return { results, usage };
}
