// TODO: Supabase(북마크 저장) 연동 전까지 사용하는 목업 서비스.
// 02_동작규칙 5-2 "열 때마다 그날 가격으로 다시 계산합니다" — 저장된 recipeId로 현재 목업
// 가격표를 다시 계산해 보여준다. 실제 저장/조회 자체는 RecibiAppContext가 localStorage로 한다.

import { resolveRecipeForResult } from "@/lib/data/recibi/recipes";
import { calcIngredientTotals, calcPerServing } from "@/lib/recibi/calc";
import type { Bookmark, BookmarkWithLivePrice } from "@/types/recibi";

const RECALC_DELAY_MS = 400;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function recalcBookmarks(bookmarks: Bookmark[]): Promise<BookmarkWithLivePrice[]> {
  await wait(RECALC_DELAY_MS);
  return bookmarks.map((bookmark) => {
    const recipe = resolveRecipeForResult(bookmark.recipeId);
    if (!recipe) return { ...bookmark, cost: 0, perServing: 0 };
    const { costTotal } = calcIngredientTotals(recipe.ingredients, { checked: {}, manualPrices: {} });
    return { ...bookmark, cost: costTotal, perServing: calcPerServing(costTotal, bookmark.servings) };
  });
}
