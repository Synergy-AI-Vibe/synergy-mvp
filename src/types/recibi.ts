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
  | "탈퇴가 완료되었습니다."
  | "카카오 인증에 실패했습니다. 다시 시도해 주세요.";

/** h1 링크로 계산 ↔ h2 레시피 직접 입력 (02_동작규칙 2-1) */
export type RecipeInputMode = "url" | "text";

/**
 * 홈에서 넣은 검색 입력. 결과 화면 상단에도 같은 자리에 그대로 남아야 해서 화면 밖에 둔다.
 * 입력 모드는 여기가 아니라 주소의 ?mode= 로 다룬다 — 링크를 걸거나 새로고침해도 유지되어야 한다.
 */
export interface RecipeSearchState {
  url: string;
  text: string;
}
