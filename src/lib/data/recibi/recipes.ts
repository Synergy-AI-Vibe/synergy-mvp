// TODO: Supabase(유튜브 추출·가격 API) 연동 전까지 사용하는 목업 데이터
// 김치찌개 재료 원가는 02_동작규칙 4항 표의 실측값을 그대로 쓴다(전부 체크 시 합계 12,854원 일치).
// 제육볶음·된장찌개는 문서에 값이 없어 같은 형식으로 채운 목업이다.

import type { Recipe } from "@/types/recibi";
import { findIngredientPrice, PRICE_UPDATED_AT } from "./ingredients";
import { pantryRecipes } from "./pantry-recipes";

const kimchiJjigae: Recipe = {
  id: "kimchi-jjigae",
  title: "돼지고기 김치찌개",
  sourceLabel: "유튜브 · 자취요리연구소",
  servings: 2,
  cookMinutes: 30,
  priceUpdatedAt: PRICE_UPDATED_AT,
  eatOutPrice: { min: 18000, max: 24000, avg: 22000, deliveryFee: 3000 },
  ingredients: [
    { id: "pork-neck", name: "돼지고기 목살", amountLabel: "300g", unitLabel: "냉장 목살 500g 팩", unitPrice: 7900, cost: 4740, source: "참가격", note: "500g 팩 → 300g 사용" },
    { id: "kimchi", name: "신김치", amountLabel: "400g", unitLabel: "포기김치 900g", unitPrice: 8900, cost: 3955, source: "참가격", note: "반 포기 → 400g" },
    { id: "tofu", name: "두부", amountLabel: "300g", unitLabel: "찌개용 1모 300g", unitPrice: 2180, cost: 2180, source: "참가격" },
    { id: "green-onion", name: "대파", amountLabel: "90g", unitLabel: "1단 3대 250g", unitPrice: 2480, cost: 892, source: "KAMIS", note: "1단 중 90g만 사용" },
    { id: "onion", name: "양파", amountLabel: "200g", unitLabel: "1.5kg 망", unitPrice: 3290, cost: 438, source: "KAMIS" },
    { id: "chili-powder", name: "고춧가루", amountLabel: "7g", unitLabel: "250g", unitPrice: 9800, cost: 274, source: "KAMIS", note: "적당량 → 7g 추정", estimated: true },
    { id: "minced-garlic", name: "다진마늘", amountLabel: "15g", unitLabel: "200g", unitPrice: 3200, cost: 240, source: "오픈마켓", note: "한 줌 → 15g 추정", estimated: true },
    { id: "soup-soy-sauce", name: "국간장", amountLabel: "15ml", unitLabel: "500ml", unitPrice: 4500, cost: 135, source: "오픈마켓" },
    { id: "bone-broth", name: "사골육수 팩", amountLabel: "500ml", unitLabel: "가격 데이터 없음", unitPrice: null, cost: null, source: null, hasNoPriceData: true },
  ],
  steps: [
    { order: 1, title: "재료 손질", body: "돼지고기 목살은 한입 크기로 썰고, 김치는 속을 털어 3~4cm 폭으로 썬다.", minutes: 5 },
    { order: 2, title: "고기 볶기", body: "냄비에 돼지고기와 다진마늘을 넣고 겉면이 익을 때까지 볶는다.", minutes: 5 },
    { order: 3, title: "끓이기", body: "김치와 사골육수, 물 두 컵을 부어 센 불에서 끓인 뒤 중불로 낮춰 15분간 끓인다.", minutes: 15 },
    { order: 4, title: "마무리", body: "두부·대파·양파를 넣고 국간장으로 간을 맞춘 뒤 한소끔 더 끓인다.", minutes: 5 },
  ],
  rawDescription:
    "안녕하세요 자취요리연구소입니다! 오늘은 자취생 필수 메뉴, 돼지고기 김치찌개 만들어볼게요.\n" +
    "구독과 좋아요는 큰 힘이 됩니다 :)\n\n" +
    "[재료]\n돼지고기 목살 300g, 신김치 400g, 두부 300g, 대파 90g, 양파 200g, 고춧가루 적당량, 다진마늘 한 줌, 국간장 15ml, 사골육수 팩 500ml\n\n" +
    "00:00 인트로\n01:20 재료 손질\n04:10 볶기\n08:30 끓이기\n\n" +
    "이 영상은 OO주방용품과 함께합니다.",
};

const jeyukBokkeum: Recipe = {
  id: "jeyuk-bokkeum",
  title: "제육볶음",
  sourceLabel: "유튜브 · 자취요리연구소",
  servings: 2,
  cookMinutes: 25,
  priceUpdatedAt: PRICE_UPDATED_AT,
  eatOutPrice: { min: 10000, max: 14000, avg: 12000, deliveryFee: 3000 },
  ingredients: [
    { id: "pork-neck", name: "돼지고기 앞다리살", amountLabel: "400g", unitLabel: "앞다리 국거리 700g 팩", unitPrice: 8900, cost: 5086, source: "참가격", note: "700g 팩 → 400g 사용" },
    { id: "onion", name: "양파", amountLabel: "150g", unitLabel: "1.5kg 망", unitPrice: 3290, cost: 329, source: "KAMIS" },
    { id: "green-onion", name: "대파", amountLabel: "40g", unitLabel: "1단 3대 250g", unitPrice: 2480, cost: 397, source: "KAMIS" },
    { id: "gochujang", name: "고추장", amountLabel: "40g", unitLabel: "500g", unitPrice: 6500, cost: 520, source: "참가격" },
    { id: "chili-powder", name: "고춧가루", amountLabel: "10g", unitLabel: "250g", unitPrice: 9800, cost: 392, source: "KAMIS", note: "적당량 → 10g 추정", estimated: true },
    { id: "minced-garlic", name: "다진마늘", amountLabel: "10g", unitLabel: "200g", unitPrice: 3200, cost: 160, source: "오픈마켓" },
  ],
  steps: [
    { order: 1, title: "밑간", body: "돼지고기에 고추장·고춧가루·다진마늘을 넣어 버무린 뒤 10분간 재운다.", minutes: 10 },
    { order: 2, title: "채소 준비", body: "양파와 대파를 굵게 채 썬다.", minutes: 5 },
    { order: 3, title: "볶기", body: "팬을 달궈 재운 고기를 먼저 볶다가 채소를 넣고 센 불에서 5분 더 볶는다.", minutes: 10 },
  ],
  rawDescription:
    "매콤달콤 제육볶음 레시피 알려드립니다.\n\n[재료]\n돼지고기 앞다리살 400g, 양파 150g, 대파 40g, 고추장 40g, 고춧가루 적당량, 다진마늘 10g",
};

const doenjangJjigae: Recipe = {
  id: "doenjang-jjigae",
  title: "된장찌개",
  sourceLabel: "유튜브 · 자취요리연구소",
  servings: 2,
  cookMinutes: 20,
  priceUpdatedAt: PRICE_UPDATED_AT,
  eatOutPrice: { min: 9000, max: 12000, avg: 10000, deliveryFee: 3000 },
  ingredients: [
    { id: "tofu", name: "두부", amountLabel: "200g", unitLabel: "찌개용 1모 300g", unitPrice: 2180, cost: 1453, source: "참가격", note: "1모 → 200g 사용" },
    { id: "zucchini", name: "애호박", amountLabel: "1/2개", unitLabel: "1개", unitPrice: 1600, cost: 800, source: "KAMIS", note: "1개 → 1/2개 사용" },
    { id: "onion", name: "양파", amountLabel: "100g", unitLabel: "1.5kg 망", unitPrice: 3290, cost: 219, source: "KAMIS" },
    { id: "green-onion", name: "대파", amountLabel: "30g", unitLabel: "1단 3대 250g", unitPrice: 2480, cost: 298, source: "KAMIS" },
    { id: "minced-garlic", name: "다진마늘", amountLabel: "10g", unitLabel: "200g", unitPrice: 3200, cost: 160, source: "오픈마켓" },
    { id: "doenjang", name: "된장", amountLabel: "40g", unitLabel: "가격 데이터 없음", unitPrice: null, cost: null, source: null, hasNoPriceData: true },
  ],
  steps: [
    { order: 1, title: "육수 내기", body: "물에 멸치와 다시마를 넣어 10분간 끓인 뒤 건더기를 건진다.", minutes: 10 },
    { order: 2, title: "재료 넣기", body: "된장을 풀어 넣고 애호박·양파·대파를 넣어 끓인다.", minutes: 5 },
    { order: 3, title: "마무리", body: "두부와 다진마늘을 넣고 3분 더 끓인다.", minutes: 5 },
  ],
  rawDescription: "구수한 집밥 된장찌개입니다.\n\n[재료]\n두부 200g, 애호박 1/2개, 양파 100g, 대파 30g, 다진마늘 10g, 된장 40g",
};

export const recipeCatalog: Recipe[] = [kimchiJjigae, jeyukBokkeum, doenjangJjigae];

export function findRecipeById(id: string): Recipe | undefined {
  return recipeCatalog.find((r) => r.id === id);
}

/** 홈 화면 계산 결과로 항상 이 레시피를 돌려준다 (실제 추출 없이 목업으로 고정) */
export const defaultExtractedRecipeId = kimchiJjigae.id;

/**
 * 데모 목적 — 링크에 "empty"가 포함되면 추출 실패(h4)로 처리한다.
 * 예: https://youtu.be/empty
 */
export function shouldSimulateExtractionFailure(input: string): boolean {
  return /empty/i.test(input);
}

/**
 * 있는 재료로 찾기(SUB)의 후보 7개 중 recipeCatalog에 상세 정보가 없는 4개는
 * pantry-recipes.ts 값으로 최소 결과 화면을 즉석에서 만들어 보여준다 (조리법 없음, 원문 없음).
 */
export function resolveRecipeForResult(id: string): Recipe | undefined {
  const direct = findRecipeById(id);
  if (direct) return direct;

  const pantryRecipe = pantryRecipes.find((r) => r.id === id);
  if (!pantryRecipe) return undefined;

  const ingredients: Recipe["ingredients"] = pantryRecipe.requiredIngredients.map((req) => {
    const priceEntry = findIngredientPrice(req.ingredientId);
    return {
      id: req.ingredientId,
      name: priceEntry?.name ?? req.name,
      amountLabel: "레시피 기준량",
      unitLabel: priceEntry?.unitLabel ?? "-",
      unitPrice: priceEntry?.unitPrice ?? req.cost,
      cost: req.cost,
      source: priceEntry?.source ?? "오픈마켓",
    };
  });

  const avg = pantryRecipe.eatOutPriceAvg;
  return {
    id: pantryRecipe.id,
    title: pantryRecipe.title,
    sourceLabel: "있는 재료로 찾기 · 추천 레시피",
    servings: 2,
    cookMinutes: 20,
    priceUpdatedAt: PRICE_UPDATED_AT,
    eatOutPrice: { min: Math.round(avg * 0.85), max: Math.round(avg * 1.1), avg, deliveryFee: 3000 },
    ingredients,
    steps: null,
    rawDescription: null,
  };
}
