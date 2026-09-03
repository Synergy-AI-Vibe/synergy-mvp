/**
 * 있는 재료로 찾기 (pantry) — BE 응답 계약
 *
 * types/api.ts 는 지정 담당자만 수정하므로 pantry 계약은 별도 파일로 둡니다.
 * FE(pantry-service)가 이 형태를 받아 화면 타입(PantryMatch)으로 변환합니다.
 */

export interface PantryRequest {
  /** 보유 재료 1~5개. 화면 규칙: 항목당 10자까지 */
  ingredients: string[]
}

export interface PantryExtraIngredient {
  /** LLM이 준 일반 명사 표기. 화면에 그대로 노출 */
  name: string
  /** 표준 품목명 (규칙 매칭 실패 시 null → 가격 미확인) */
  canonical: string | null
  /** 최소 구매 단위 가격 — "사야 하는 금액"의 실체 */
  packCost: number | null
  /** "500g 팩 9,250원" 형태. packCost 없으면 null */
  packLabel: string | null
  /** actual=KAMIS 실시세 · estimate=시드 · null=가격 없음 */
  priceConfidence: 'actual' | 'estimate' | null
  hasPrice: boolean
}

export interface PantryMenu {
  /** 메뉴 이름. 장르 제한 없음 (한식·양식·중식·일식 …) */
  name: string
  /** 한 문장 설명 */
  description: string
  /** 입력 재료 중 이 메뉴가 쓰는 것 (입력의 부분집합만 허용) */
  usedIngredients: string[]
  /** 추가로 사야 하는 재료 */
  extraIngredients: PantryExtraIngredient[]
  /** 가격이 붙은 추가 재료의 packCost 합 (원 단위 정수) */
  extraCost: number
  /** 가격을 못 붙인 추가 재료 수 — 0이 아니면 extraCost 는 하한값 */
  unpricedCount: number
}

export type PantryResponse =
  | { status: 'success'; menus: PantryMenu[] }
  | { status: 'error'; message: string }
