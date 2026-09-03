// 있는 재료로 찾기 — /api/pantry 실연동.
// LLM 이 메뉴를 추천하고, 추가 재료 금액은 BE 가격 파이프라인(KAMIS 실시세 → 시드)이 붙입니다.
// 화면 타입(PantryMatch)은 그대로 두고 여기서 BE 계약(types/pantry.ts)을 변환합니다.

import type { PantryResponse } from "@/types/pantry";
import type { ChosenPantryIngredient, PantryMatch } from "@/types/recibi";

export async function searchPantryRecipes(chosen: ChosenPantryIngredient[]): Promise<PantryMatch[]> {
  let json: PantryResponse;
  try {
    const res = await fetch("/api/pantry", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ingredients: chosen.map((c) => c.label) }),
    });
    json = (await res.json()) as PantryResponse;
  } catch {
    return []; // 네트워크 실패 — 화면은 빈 결과 상태로
  }
  if (json.status !== "success") return [];

  return json.menus.map((menu, i) => ({
    recipe: {
      // LLM 추천 메뉴는 저장된 레시피가 아니므로 합성 id 를 씁니다.
      // r1(결과 화면)로의 이동은 유튜브 분석을 거쳐야 성립합니다 — 카드에서 막아주세요.
      id: `pantry-${i}`,
      title: menu.name,
      eatOutPriceAvg: 0,
      requiredIngredients: menu.usedIngredients.map((name) => ({
        ingredientId: name,
        name,
        cost: 0,
      })),
    },
    missing: menu.extraIngredients.map((e) => ({
      ingredientId: e.canonical ?? e.name,
      // 가격 미확인 재료는 0원이 아니라 "미확인"임이 문구로 드러나야 합니다
      name: e.hasPrice ? e.name : `${e.name}(가격 미확인)`,
      cost: e.packCost ?? 0,
    })),
    extraCost: menu.extraCost,
    savings: 0,
  }));
}
