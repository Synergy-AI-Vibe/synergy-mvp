// 목업 전용 — 실제 분석이 아니다.
// 있는 재료로 찾기(SUB)는 백엔드가 없어 /api/analyze를 부를 수 없다. 그래도 "결과 열기"를 누르면
// 실제 결과 화면(/result)을 그대로 재사용할 수 있도록, PantryMatch를 AnalyzeData와 같은 모양으로
// 바꿔주는 어댑터만 둔다. computeTotals/computeWarnings(@/lib/calc)는 실제와 동일하게 적용된다.

import { computeTotals, computeWarnings } from "@/lib/calc";
import type { AnalyzeData, IngredientRow, StorePrice } from "@/types/api";
import type { PantryMatch } from "@/types/recibi";
import { PRICE_UPDATED_AT } from "./ingredients";

const PANTRY_MOCK_SERVINGS = 2;

export function pantryMatchToAnalysisData(match: PantryMatch): AnalyzeData {
  const missingIds = new Set(match.missing.map((m) => m.ingredientId));

  const ingredients: IngredientRow[] = match.recipe.requiredIngredients.map((req, index) => ({
    id: index,
    rawText: req.name,
    name: req.name,
    role: "main",
    qty: null,
    unit: null,
    amount: null,
    amountUnit: null,
    conversionNote: null,
    needsConfirm: false,
    unitCost: req.cost,
    packCost: req.cost,
    packLabel: null,
    priceTier: 2,
    priceConfidence: "estimate",
    hasPrice: true,
    // 이미 가진 재료(= missing 목록에 없는 것)는 "집에 있음"으로 미리 체크 해제해 둔다.
    checked: missingIds.has(req.ingredientId),
    userPrice: null,
  }));

  const store: StorePrice = {
    menuName: match.recipe.title,
    min: match.recipe.eatOutPriceAvg,
    max: match.recipe.eatOutPriceAvg,
    avg: match.recipe.eatOutPriceAvg,
    deliveryFee: 0,
    sampleSize: 0,
    surveyedOn: PRICE_UPDATED_AT,
  };

  return {
    recipe: {
      title: match.recipe.title,
      servings: PANTRY_MOCK_SERVINGS,
      sourceType: "manual",
      sourceUrl: null,
      thumbnailUrl: null,
      channelName: null,
      steps: [],
      rawText: null,
    },
    ingredients,
    store,
    totals: computeTotals(ingredients, store, PANTRY_MOCK_SERVINGS),
    warnings: computeWarnings(ingredients),
    priceBaseDate: PRICE_UPDATED_AT,
    normalize: null,
  };
}
