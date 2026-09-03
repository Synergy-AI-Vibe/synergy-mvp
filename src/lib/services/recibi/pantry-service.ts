// TODO: Supabase 연동 전까지 사용하는 목업 서비스 (있는 재료로 찾기 SUB)

import { pantryRecipes } from "@/lib/data/recibi/pantry-recipes";
import { findPantryMatches } from "@/lib/recibi/calc";
import type { ChosenPantryIngredient, PantryMatch } from "@/types/recibi";

const SEARCH_DELAY_MS = 700;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function searchPantryRecipes(chosen: ChosenPantryIngredient[]): Promise<PantryMatch[]> {
  await wait(SEARCH_DELAY_MS);
  return findPantryMatches(pantryRecipes, chosen);
}
