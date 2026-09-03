// 있는 재료로 찾기(SUB)는 백엔드가 없어 목업을 그대로 쓴다 — 이 파일은 그 목업 전용 타입만 남긴다.
// 나머지(레시피·재료·북마크)는 실제 계약인 @/types/api 로 대체됐다.

export interface PantryRequiredIngredient {
  ingredientId: string;
  name: string;
  /** 이 레시피에서 이 재료가 차지하는 원가 (목업) */
  cost: number;
}

export interface PantryRecipe {
  id: string;
  title: string;
  eatOutPriceAvg: number;
  requiredIngredients: PantryRequiredIngredient[];
}

export interface PantryMatch {
  recipe: PantryRecipe;
  missing: PantryRequiredIngredient[];
  extraCost: number;
  savings: number;
}

export interface ChosenPantryIngredient {
  id: string;
  label: string;
  ingredientId?: string;
}

export type ToastMessage =
  | "카카오 계정으로 로그인했습니다."
  | "로그아웃되었습니다."
  | "탈퇴가 완료되었습니다.";
