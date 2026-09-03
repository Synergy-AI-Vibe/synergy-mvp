/**
 * 목 응답 — 파이프라인 완성 전에 FE가 화면을 만들기 위한 것.
 *
 * 실제 로직이 붙으면 route.ts 에서 이 import 만 지우면 됩니다.
 * FE 코드는 한 줄도 고칠 필요가 없습니다.
 */

import type { AnalyzeData, AnalyzeResponse, IngredientRow, StorePrice } from '@/types/api'
import { computeTotals, computeWarnings } from '@/lib/calc'

const store: StorePrice = {
  menuName: '김치찌개',
  min: 18000,
  max: 24000,
  avg: 22000,
  deliveryFee: 3000,
  sampleSize: 5,
  surveyedOn: '2026-09-01',
}

const ingredients: IngredientRow[] = [
  {
    id: 1, rawText: '묵은지 300g', name: '김치', role: 'main',
    qty: 300, unit: 'g', amount: 300, amountUnit: 'g',
    conversionNote: null, needsConfirm: false,
    unitCost: 1050, packCost: 7000, packLabel: '2kg 7,000원',
    priceTier: 1, priceConfidence: 'actual', hasPrice: true,
    checked: true, userPrice: null,
  },
  {
    id: 2, rawText: '통삼겹 400g', name: '돼지고기 삼겹살', role: 'main',
    qty: 400, unit: 'g', amount: 400, amountUnit: 'g',
    conversionNote: null, needsConfirm: false,
    unitCost: 11784, packCost: 17676, packLabel: '600g 17,676원',
    priceTier: 1, priceConfidence: 'actual', hasPrice: true,
    checked: true, userPrice: null,
  },
  {
    id: 3, rawText: '두부 1/2모', name: '두부', role: 'main',
    qty: 0.5, unit: '모', amount: 150, amountUnit: 'g',
    conversionNote: '1/2모 → 150g', needsConfirm: false,
    unitCost: 950, packCost: 1900, packLabel: '300g 1,900원',
    priceTier: 2, priceConfidence: 'estimate', hasPrice: true,
    checked: true, userPrice: null,
  },
  {
    id: 4, rawText: '대파 1대', name: '대파', role: 'main',
    qty: 1, unit: '대', amount: 100, amountUnit: 'g',
    conversionNote: '1대 → 100g', needsConfirm: false,
    unitCost: 319, packCost: 1595, packLabel: '500g 1,595원',
    priceTier: 1, priceConfidence: 'actual', hasPrice: true,
    checked: true, userPrice: null,
  },
  {
    id: 5, rawText: '다진 마늘 1큰술', name: '마늘', role: 'main',
    qty: 1, unit: '큰술', amount: 10, amountUnit: 'g',
    conversionNote: '1큰술 → 10g', needsConfirm: false,
    unitCost: 102, packCost: 2034, packLabel: '200g 2,034원',
    priceTier: 1, priceConfidence: 'actual', hasPrice: true,
    checked: true, userPrice: null,
  },
  {
    id: 6, rawText: '고춧가루 1큰술', name: '고춧가루', role: 'seasoning',
    qty: 1, unit: '큰술', amount: 7, amountUnit: 'g',
    conversionNote: '1큰술 → 7g', needsConfirm: false,
    unitCost: 263, packCost: 9383, packLabel: '250g 9,383원',
    priceTier: 1, priceConfidence: 'actual', hasPrice: true,
    checked: true, userPrice: null,
  },
  {
    // 환산 실패 케이스 — 화면에 "확인 필요" 표시. 지어내지 않는다
    id: 7, rawText: '국물용 멸치 한 줌', name: '멸치', role: 'main',
    qty: 1, unit: '줌', amount: 30, amountUnit: 'g',
    conversionNote: '한 줌 → 30g 추정', needsConfirm: true,
    unitCost: 900, packCost: 6000, packLabel: '200g 6,000원',
    priceTier: 2, priceConfidence: 'estimate', hasPrice: true,
    checked: true, userPrice: null,
  },
  {
    // 가격 없음 케이스 — 4-2 직접 입력 UI. 조미료라 경고 배지는 생략
    id: 8, rawText: '멸치액젓 1큰술', name: null, role: 'seasoning',
    qty: 1, unit: '큰술', amount: null, amountUnit: null,
    conversionNote: null, needsConfirm: true,
    unitCost: null, packCost: null, packLabel: null,
    priceTier: null, priceConfidence: null, hasPrice: false,
    checked: true, userPrice: null,
  },
]

const data: AnalyzeData = {
  recipe: {
    title: '돼지고기 김치찌개',
    servings: 2,
    sourceType: 'youtube',
    sourceUrl: 'https://www.youtube.com/watch?v=MOCK',
    thumbnailUrl: null,
    channelName: '집밥채널',
    steps: [
      '냄비에 참기름을 두르고 돼지고기를 볶습니다.',
      '묵은지를 넣고 5분간 함께 볶습니다.',
      '물을 붓고 고춧가루와 다진 마늘을 넣어 끓입니다.',
      '두부와 대파를 넣고 10분 더 끓입니다.',
    ],
    rawText: null,
  },
  ingredients,
  store,
  totals: computeTotals(ingredients, store, 2),
  warnings: computeWarnings(ingredients),
  priceBaseDate: '2026-09-01',
  // 규칙 5 · 캐시 1 · LLM 1 · 미매칭 1 — FE가 "AI가 몇 개를 풀었나" 표시를 만들 수 있게
  normalize: { total: 8, rule: 5, cache: 1, llm: 1, missed: 1, llmCalled: true },
}

/** 성공 케이스 */
export const MOCK_SUCCESS: AnalyzeResponse = { status: 'success', data }

/** 매장가 없는 케이스 — r1 비교 영역이 접히는지 확인용 */
export const MOCK_NO_STORE: AnalyzeResponse = {
  status: 'success',
  data: {
    ...data,
    store: null,
    totals: computeTotals(ingredients, null, 2),
  },
}

/**
 * 추출 실패 — PoC 실측 35%. 에러가 아니라 정상 경로다.
 * FE는 h4 실패 카드로 보내고 그 안에서 직접 입력을 받는다.
 */
export const MOCK_NOT_FOUND: AnalyzeResponse = {
  status: 'no_recipe_found',
  videoTitle: '5분만에 뚝딱 김치찌개',
  thumbnailUrl: null,
  message: '영상에서 재료를 찾지 못했어요. 아래에 직접 적어주시면 바로 계산해 드릴게요.',
}
