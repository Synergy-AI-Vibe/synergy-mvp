// TODO: Supabase(유튜브 추출) 연동 전까지 사용하는 목업 서비스.
// 실제 추출 없이 항상 같은 목업 레시피를 돌려주되, 인위적 지연을 둬 c2(계산 대기) 스켈레톤이
// 실제로 보이게 한다 (11_디자인시스템 4-1항 — 스피너·진행바 금지, 스켈레톤만 사용).

import { defaultExtractedRecipeId, findRecipeById, shouldSimulateExtractionFailure } from "@/lib/data/recibi/recipes";
import type { Recipe } from "@/types/recibi";

const EXTRACTION_DELAY_MS = 900;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export interface ExtractionResult {
  ok: boolean;
  recipe?: Recipe;
}

export async function extractRecipeFromUrl(url: string): Promise<ExtractionResult> {
  await wait(EXTRACTION_DELAY_MS);
  if (shouldSimulateExtractionFailure(url)) return { ok: false };
  return { ok: true, recipe: findRecipeById(defaultExtractedRecipeId) };
}

export async function extractRecipeFromText(text: string): Promise<ExtractionResult> {
  await wait(EXTRACTION_DELAY_MS);
  if (shouldSimulateExtractionFailure(text)) return { ok: false };
  return { ok: true, recipe: findRecipeById(defaultExtractedRecipeId) };
}

export async function getRecipe(id: string): Promise<Recipe | undefined> {
  await wait(150);
  return findRecipeById(id);
}
