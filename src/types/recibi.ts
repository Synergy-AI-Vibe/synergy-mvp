// 레시비(recibi.kr) 도메인 타입 — 02_동작규칙 9항 "주고받는 데이터" 기준

export type PriceSource = "참가격" | "KAMIS" | "오픈마켓";

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

/** 재료 가격표 1행 — 18종 고정 목업 (KAMIS·참가격·오픈마켓 대응) */
export interface IngredientPriceEntry {
  id: string;
  /** 재료 행에 쓰는 정식 이름 (예: "돼지고기 목살") */
  name: string;
  /** 있는 재료로 찾기 칩·매칭에 쓰는 짧은 이름 (예: "돼지고기") */
  pantryLabel: string;
  unitLabel: string;
  unitPrice: number;
  source: PriceSource;
}

/** 레시피 안에서 실제로 쓰는 재료 한 줄 (r2 IngredientRow) */
export interface RecipeIngredient {
  id: string;
  name: string;
  amountLabel: string;
  unitLabel: string;
  unitPrice: number | null;
  /** 이 요리에 쓰는 양만큼의 원가. 가격 데이터 없으면 null */
  cost: number | null;
  source: PriceSource | null;
  /** 환산 근거 — "반 포기 → 400g", "적당량 → 15g 추정" */
  note?: string;
  estimated?: boolean;
  /** 공공 가격 데이터에 없는 재료 (사골육수 팩 등) */
  hasNoPriceData?: boolean;
}

export interface CookingStep {
  order: number;
  title: string;
  body: string;
  minutes?: number;
}

export interface EatOutPrice {
  min: number;
  max: number;
  avg: number;
  deliveryFee: number;
}

export interface Recipe {
  id: string;
  title: string;
  sourceLabel: string;
  servings: number;
  cookMinutes: number;
  ingredients: RecipeIngredient[];
  /** 직접 입력으로 만든 레시피는 조리 순서가 없을 수 있음 (02_동작규칙 10-6, 미정 — 빈 상태로 둠) */
  steps: CookingStep[] | null;
  rawDescription: string | null;
  eatOutPrice: EatOutPrice;
  priceUpdatedAt: string;
}

export interface Bookmark {
  id: string;
  recipeId: string;
  title: string;
  sourceLabel: string;
  servings: number;
  savedAt: string;
}

/** 목록에 보여줄 때는 그날 가격으로 다시 계산한 값을 합쳐서 씀 (05_동작규칙 5-2) */
export interface BookmarkWithLivePrice extends Bookmark {
  cost: number;
  perServing: number;
}

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

export interface User {
  name: string;
}

export type ToastMessage =
  | "카카오 계정으로 로그인했습니다."
  | "로그아웃되었습니다."
  | "탈퇴가 완료되었습니다.";

/** 링크/직접입력 추출 실패 사유 — 02_동작규칙 10-3 미정, 화면 표시는 하나로 통일 */
export interface ExtractionFailure {
  reason: string;
}
