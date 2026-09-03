// 매장가(사 먹으면 얼마) LLM 추정.
//
// store_price 테이블은 20개 고정 카테고리만 조사돼 있고, 그마저도 대부분
// 비어 있다(BE-3). 조사되지 않은 메뉴나 20종에 없는 메뉴는 화면에서
// r1 비교 영역이 통째로 접혔는데, 그 대신 Gemini에게 "2인분 배달 주문 시
// 예상 가격"을 여러 번 추정하게 하고 중앙값을 쓴다.
//
// ⚠️ 이건 실측이 아니라 LLM의 추정치다. 배민·요기요 실측이 있는 편이 항상
//    더 정확하다 — 다만 이 프로젝트는 실측을 매 요청마다 할 수 없으니,
//    분산을 줄이기 위해 여러 추정치의 중앙값을 쓴다.
import '../env.js';
import { generateJsonWithRetry, pickModel } from '../llm/gemini.js';

// 모델은 프로세스당 한 번만 고른다 (normalize.js 와 동일한 이유).
let defaultModelPromise = null;
function defaultModel() {
  if (!defaultModelPromise) {
    defaultModelPromise = pickModel().catch((e) => {
      defaultModelPromise = null;
      throw e;
    });
  }
  return defaultModelPromise;
}

const SYSTEM = `당신은 한국 배달 플랫폼(배달의민족·요기요 등)의 메뉴 가격에 정통한 리서처입니다.

규칙:
- 주어진 요리를 2인분 기준으로 배달 주문했을 때 예상되는 가격을 추정합니다.
- 서로 다른 매장에서 주문한다고 가정하고, 요청한 개수만큼 독립적인 추정치를 제시하세요.
  값은 현실적인 범위 안에서 약간씩 다르게 잡습니다. 전부 같은 값을 반복하지 마세요.
- menuPrice 는 메뉴 자체 가격(원), deliveryFee 는 배달비(원)입니다.
- 실제로 존재하는 매장 이름이나 가짜 근거를 지어내지 마세요. 가격 숫자만 답합니다.
- 배달 주문이 성립하지 않는 입력(재료명, 조리도구, 의미 없는 문자열 등)이면
  estimates 를 빈 배열로 반환하세요. 억지로 값을 만들지 마세요.`;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    estimates: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          menuPrice: { type: 'NUMBER', description: '메뉴 자체 가격(원)' },
          deliveryFee: { type: 'NUMBER', description: '배달비(원)' },
        },
        required: ['menuPrice', 'deliveryFee'],
      },
    },
  },
  required: ['estimates'],
};

function median(nums) {
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[mid]
    : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

/**
 * @param {string} menuTitle 레시피/메뉴 제목
 * @param {{ model?: string, sampleCount?: number, timeout?: number }} [opts]
 * @returns {Promise<object|null>} StorePrice 형태, 추정 실패 시 null
 */
export async function estimateStorePrice(menuTitle, opts = {}) {
  const title = String(menuTitle || '').trim();
  if (!title) return null;

  let model;
  try {
    model = opts.model ?? (await defaultModel());
  } catch (e) {
    // GEMINI_API_KEY 없거나 모델 조회 실패 — 매장가 없이 진행 (호출부가 DB 폴백)
    console.warn('[estimateStorePrice] model 선택 실패', e.message);
    return null;
  }

  const sampleCount = opts.sampleCount ?? 5;
  const user =
    `## 요리\n${title}\n\n` +
    `2인분 기준으로 배달 주문했을 때 예상되는 가격을 서로 다른 매장 기준으로 ${sampleCount}개 추정해 주세요.`;

  let data;
  try {
    ({ data } = await generateJsonWithRetry({
      model,
      system: SYSTEM,
      user,
      schema: SCHEMA,
      timeout: opts.timeout ?? 60000,
    }));
  } catch (e) {
    console.warn('[estimateStorePrice] generateContent 실패', e.message);
    return null;
  }

  const estimates = (data?.estimates || [])
    .map((e) => ({
      menuPrice: Number(e?.menuPrice),
      deliveryFee: Number(e?.deliveryFee),
    }))
    .filter(
      (e) =>
        Number.isFinite(e.menuPrice) &&
        e.menuPrice > 0 &&
        Number.isFinite(e.deliveryFee) &&
        e.deliveryFee >= 0
    );

  if (!estimates.length) return null;

  const totals = estimates.map((e) => e.menuPrice + e.deliveryFee);
  const deliveryFees = estimates.map((e) => e.deliveryFee);

  return {
    menuName: title,
    min: Math.min(...totals),
    max: Math.max(...totals),
    avg: median(totals),
    deliveryFee: median(deliveryFees),
    sampleSize: estimates.length,
    surveyedOn: new Date().toISOString().slice(0, 10),
  };
}
