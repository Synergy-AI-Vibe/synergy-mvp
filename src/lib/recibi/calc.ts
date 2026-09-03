// 순수 계산 함수 — 02_동작규칙 1-1, 3, 4, 7항의 계산식을 그대로 옮김.
// 서버를 다시 부르지 않고 화면 안에서 전부 계산한다 (02_동작규칙 4항).

import type {
  ChosenPantryIngredient,
  PantryMatch,
  PantryRecipe,
  RecipeIngredient,
} from "@/types/recibi";

export function formatWon(amount: number): string {
  return `${Math.max(Math.round(amount), 0).toLocaleString("ko-KR")}원`;
}

export function formatPercent(value: number): string {
  return `${value.toFixed(1)}%`;
}

/** 3-1 절약 금액 — 절약 = max(사먹는가격 − 재료비합계, 0) */
export function calcSavings(eatOutAvg: number, ingredientTotal: number) {
  const amount = Math.max(eatOutAvg - ingredientTotal, 0);
  const percent = eatOutAvg > 0 ? Number(((amount / eatOutAvg) * 100).toFixed(1)) : 0;
  return { amount, percent };
}

/** 3-2 비교 막대 — 해먹는 채움 = min(합계 ÷ 사먹는가격 × 100, 100) */
export function calcBarFillPercent(eatOutAvg: number, ingredientTotal: number): number {
  if (eatOutAvg <= 0) return 0;
  return Number(Math.min((ingredientTotal / eatOutAvg) * 100, 100).toFixed(1));
}

/** 3-3 1인분 환산 — Math.round(합계 ÷ 인분수) */
export function calcPerServing(total: number, servings: number): number {
  return servings > 0 ? Math.round(total / servings) : 0;
}

export interface IngredientAdjustState {
  /** 체크 해제 = "집에 있음" (합계에서 제외). 기본값 true */
  checked: Record<string, boolean>;
  /** 가격 데이터 없는 재료의 직접 입력 금액. 빈 값과 0은 같게 다룸 */
  manualPrices: Record<string, number>;
}

export function isIngredientChecked(state: IngredientAdjustState, id: string): boolean {
  return state.checked[id] ?? true;
}

/** 4항 계산식 — 재료비 합계 / 장바구니 / 제외 재료 집계 */
export function calcIngredientTotals(ingredients: RecipeIngredient[], state: IngredientAdjustState) {
  let costTotal = 0;
  let cartTotal = 0;
  let excludedCount = 0;
  let excludedAmount = 0;

  for (const ing of ingredients) {
    const checked = isIngredientChecked(state, ing.id);
    if (!checked) {
      if (ing.cost) {
        excludedCount += 1;
        excludedAmount += ing.cost;
      }
      continue;
    }
    if (ing.hasNoPriceData) {
      const manual = state.manualPrices[ing.id] || 0;
      costTotal += manual;
      cartTotal += manual;
    } else {
      costTotal += ing.cost ?? 0;
      cartTotal += ing.unitPrice ?? 0;
    }
  }

  return { costTotal, cartTotal, excludedCount, excludedAmount };
}

/** 4항 "제외 안내" 문구 — 세 경우 중 하나 */
export function calcExclusionMessage(
  ingredients: RecipeIngredient[],
  state: IngredientAdjustState
): string | null {
  const excluded = ingredients.filter((i) => !isIngredientChecked(state, i.id) && i.cost);
  if (excluded.length > 0) {
    const amount = excluded.reduce((sum, i) => sum + (i.cost ?? 0), 0);
    return `집에 있는 재료 ${excluded.length}개 ${formatWon(amount)} 제외됨`;
  }

  const priceless = ingredients.find((i) => i.hasNoPriceData);
  if (priceless && isIngredientChecked(state, priceless.id)) {
    const manual = state.manualPrices[priceless.id] || 0;
    if (manual > 0) {
      return `${priceless.name}은 직접 입력한 ${formatWon(manual)}으로 계산했습니다`;
    }
    return `${priceless.name}은 금액을 넣기 전까지 합계에 없습니다`;
  }

  return null;
}

/** 7-3 있는 재료로 찾기 — 매칭·정렬 */
export function findPantryMatches(
  recipes: PantryRecipe[],
  chosen: ChosenPantryIngredient[]
): PantryMatch[] {
  const chosenLabels = new Set(chosen.map((c) => normalizeLabel(c.label)));

  const matches: PantryMatch[] = recipes
    .map((recipe) => {
      const missing = recipe.requiredIngredients.filter(
        (req) => !chosenLabels.has(normalizeLabel(req.name))
      );
      const overlap = recipe.requiredIngredients.length - missing.length;
      const extraCost = missing.reduce((sum, m) => sum + m.cost, 0);
      const totalCost = recipe.requiredIngredients.reduce((sum, r) => sum + r.cost, 0);
      const savings = Math.max(recipe.eatOutPriceAvg - totalCost, 0);
      return { recipe, missing, extraCost, savings, overlap };
    })
    .filter((m) => m.overlap >= 2)
    .sort((a, b) => a.extraCost - b.extraCost || a.missing.length - b.missing.length)
    .slice(0, 5);

  return matches.map(({ recipe, missing, extraCost, savings }) => ({
    recipe,
    missing,
    extraCost,
    savings,
  }));
}

function normalizeLabel(label: string): string {
  return label.trim().toLowerCase();
}
