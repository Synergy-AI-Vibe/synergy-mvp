// LLM 기반 재료 추출. 규칙 파서(ingredients.js)가 실패했을 때만 부르는 폴백.
//
// 중요: 출력 형태를 규칙 파서와 똑같이 맞춘다({name, qty, unit, section}).
// 그래야 단위 환산(units.js)과 가격 레이어(price/index.js)를 그대로 재사용하고,
// 같은 평가 하네스로 규칙 기반과 나란히 비교할 수 있다.
import { toBaseAmount } from './units.js';
import { generateJsonWithRetry } from '../llm/gemini.js';

const SYSTEM = `당신은 한국어 레시피 텍스트에서 재료 목록을 뽑아내는 추출기입니다.

규칙:
- 레시피가 "재료"로 선언한 것만 뽑습니다. 조리 과정 설명에만 스쳐 지나가는 것은 제외합니다.
- 단위는 원문 표기를 그대로 유지합니다. "1큰술"을 15ml로 바꾸지 마세요. 환산은 별도 모듈이 합니다.
- 수량이 문장으로 흩어져 있으면 최종 사용량으로 계산해 적습니다.
  예: "계란 1알당 물은 소주컵 1잔", "계란 4알 넣었습니다" → 계란 4알, 물 4잔
- "약간", "적당량"처럼 계량값이 아닌 표현은 qty를 null로 두고 unit에 그대로 적습니다.
- 수량 표기가 아예 없으면 qty와 unit 모두 null로 둡니다.
- section에는 그 재료가 속한 구분을 적습니다(재료/양념/육수/밑간 등). 구분이 없으면 "재료".
- raw에는 그 재료의 근거가 된 원문 조각을 그대로 옮깁니다.
- 재료 목록을 찾을 수 없으면 빈 배열을 반환합니다. 절대 지어내지 마세요.
- 조리도구(계량컵, 냄비), 계량 기준 설명("1T=15ml"), 인분 표기는 재료가 아닙니다.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    ingredients: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: '재료명' },
          qty: { type: 'NUMBER', nullable: true, description: '수량. 분수는 소수로(1/2 → 0.5)' },
          unit: { type: 'STRING', nullable: true, description: '원문 단위 표기(g, ml, 큰술, 개, 모, 약간 …)' },
          section: { type: 'STRING', description: '재료/양념/육수 등 구분' },
          raw: { type: 'STRING', description: '근거가 된 원문 조각' },
        },
        required: ['name', 'section', 'raw'],
      },
    },
  },
  required: ['ingredients'],
};

/**
 * @returns {{items: Array, usage: object, model: string, method: string}}
 */
export async function extractWithLlm(text, { model, source = 'unknown' } = {}) {
  const body = String(text || '').slice(0, 20000); // 무료 티어 토큰 절약
  if (body.replace(/\s/g, '').length < 30) {
    return { items: [], usage: { input: 0, output: 0, total: 0 }, model, method: 'llm-skipped' };
  }

  const { data, usage } = await generateJsonWithRetry({
    model,
    system: SYSTEM,
    user: `다음은 ${source === 'youtube' ? '유튜브 영상 설명란' : '레시피 글'}입니다. 재료를 추출하세요.\n\n---\n${body}\n---`,
    schema: SCHEMA,
  });

  const items = (data?.ingredients || [])
    .filter((it) => it && typeof it.name === 'string' && it.name.trim())
    .map((it) => {
      const name = it.name.trim();
      const qty = Number.isFinite(it.qty) ? it.qty : null;
      const unit = it.unit && String(it.unit).trim() ? String(it.unit).trim() : null;

      // 규칙 파서와 동일한 환산·신뢰도 로직을 그대로 태운다.
      const conv = toBaseAmount(qty, unit, name);
      const item = {
        raw: it.raw || `${name} ${qty ?? ''}${unit ?? ''}`.trim(),
        section: it.section || '재료',
        name,
        qty,
        unit,
        amount: conv.convertible
          ? { value: Math.round(conv.amount * 100) / 100, base: conv.base, basis: conv.basis }
          : null,
        amountIssue: conv.convertible ? null : { reason: conv.reason, detail: conv.detail },
      };
      if (qty != null && unit && /^(kg|g|ml|mL|L|l|cc)$/i.test(unit)) item.confidence = 'high';
      else if (qty != null && conv.convertible) item.confidence = 'high';
      else if (qty != null) item.confidence = 'medium';
      else item.confidence = 'low';
      return item;
    });

  return { items, usage, model, method: 'llm' };
}
