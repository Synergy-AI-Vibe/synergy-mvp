// 있는 재료로 찾기(SUB) 전용 매칭 로직 — 백엔드가 없어 목업 위에서만 동작한다.
// 절약액·비교막대 등 결과 화면 계산은 @/lib/calc(BE·FE 공용)로 옮겨갔다.

import type { ChosenPantryIngredient, PantryMatch, PantryRecipe } from "@/types/recibi";

/** 7-3 있는 재료로 찾기 — 매칭·정렬 */
export function findPantryMatches(
  recipes: PantryRecipe[],
  chosen: ChosenPantryIngredient[]
): PantryMatch[] {
  const chosenLabels = new Set(chosen.map((c) => normalizeLabel(c.label)));

  const matches = recipes
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
