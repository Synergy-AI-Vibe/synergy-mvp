/**
 * /api/analyze 계약  (BE ⇄ FE)
 * ------------------------------------------------------------
 * 이 파일이 두 팀 사이의 유일한 합의점입니다.
 *
 * 규칙
 *   1. 소유자는 BE. 필드를 바꾸면 반드시 FE에 알린다.
 *   2. 금액은 원 단위 정수. 소수점 없음.
 *   3. date = 'YYYY-MM-DD', datetime = ISO 8601.
 *   4. 서버는 한 번만 부른다. 이후 재료 조정은 화면에서 calc.ts 로 계산한다.
 */

// ============================================================
// 요청
// ============================================================

export interface AnalyzeRequest {
  /** 유튜브 주소. text 와 둘 중 하나 필수 */
  url?: string
  /** 직접 입력한 레시피 본문 (h2) */
  text?: string
}

// ============================================================
// 응답
// ============================================================

/**
 * ⚠️ FE는 status 로 반드시 분기할 것.
 *    설명란·고정 댓글 모두 실패하는 비율이 PoC 실측 35% 다.
 *    이건 에러가 아니라 정상 경로 — h4 실패 카드로 보내고,
 *    카드 안에서 직접 입력을 받는다 (2-4).
 */
export type AnalyzeResponse =
  | { status: 'success'; data: AnalyzeData }
  | { status: 'no_recipe_found'; videoTitle: string | null; thumbnailUrl: string | null; message: string }
  | { status: 'error'; code: ErrorCode; message: string }

export type ErrorCode =
  | 'INVALID_URL'      // 유튜브 주소 형식 아님 (h3) — 보통 화면에서 먼저 걸러짐
  | 'FETCH_FAILED'     // 영상을 못 가져옴 (비공개·삭제 등)
  | 'RATE_LIMITED'     // 유튜브 API 할당량 초과
  | 'INTERNAL'

export interface AnalyzeData {
  recipe: Recipe
  ingredients: IngredientRow[]
  /** 매장가를 못 찾으면 null → r1 의 비교 영역을 접는다 */
  store: StorePrice | null
  /** 초기 렌더용. 이후 값은 FE가 calc.ts 로 다시 구한다 */
  totals: Totals
  warnings: Warnings
  /** 사용한 가격의 기준일. "9월 1일 가격 기준" 으로 노출 */
  priceBaseDate: string
  /**
   * 이름 정규화가 어느 단계에서 풀렸는지.
   * "AI를 어디에 썼나"를 숫자로 보여줄 수 있는 자리입니다 —
   * 규칙이 10개, LLM이 2개를 더 풀고, 1개는 정직하게 못 찾았다.
   */
  normalize: NormalizeStats | null
}

export interface NormalizeStats {
  total: number
  /** 1단계 — 정규식 ALIASES */
  rule: number
  /** 2단계 — DB 별칭 캐시 (지난 요청에서 LLM이 푼 것) */
  cache: number
  /** 3단계 — Gemini */
  llm: number
  /** 끝내 못 찾음 → unmatched_ingredient 로 수집됨 */
  missed: number
  llmCalled: boolean
}

// ------------------------------------------------------------

export interface Recipe {
  title: string
  servings: number
  sourceType: 'youtube' | 'manual'
  sourceUrl: string | null
  thumbnailUrl: string | null
  channelName: string | null
  /** r4 조리법. 없으면 빈 배열 */
  steps: string[]
  /** r4 하단 접힌 원문 */
  rawText: string | null
}

export type IngredientRole = 'main' | 'seasoning'
export type PriceConfidence = 'actual' | 'estimate' | 'user'

export interface IngredientRow {
  /** 화면 로컬 키 */
  id: number
  /** 원문 그대로. 매칭이 틀렸을 때 사용자에게 보여주는 값 */
  rawText: string
  /** 표준 재료명. 매칭 실패면 null */
  name: string | null
  role: IngredientRole

  /** 원문 수량·단위 ("1", "큰술") */
  qty: number | null
  unit: string | null
  /** 환산값 (10, 'g'). 환산 불가면 null */
  amount: number | null
  amountUnit: 'g' | 'ml' | 'ea' | null
  /** 화면에 그대로 노출할 근거 — "1큰술 → 10g", "적당량 → 15g 추정" */
  conversionNote: string | null
  /** 환산 불가 → 화면에 "확인 필요" 표시. 지어내지 않는다 */
  needsConfirm: boolean

  /** 소모 원가 — 실제 들어간 양만큼 */
  unitCost: number | null
  /** 장바구니 — 최소 판매 단위로 샀을 때 */
  packCost: number | null
  /** "250g 9,800원" 처럼 그대로 노출 */
  packLabel: string | null

  /** 1 KAMIS · 2 시드/크롤링 · 3 사용자입력 */
  priceTier: 1 | 2 | 3 | null
  priceConfidence: PriceConfidence | null
  /** false면 4-2 직접 입력 UI를 띄운다 */
  hasPrice: boolean

  // ── 화면 상태. 서버는 초기값만 주고 이후엔 FE가 소유한다 ──
  /** 4-1 집에 있음 해제. 행은 남기고 취소선 */
  checked: boolean
  /** 4-2 사용자가 넣은 금액. 넣기 전에는 null → 합계에 0 */
  userPrice: number | null
}

export interface StorePrice {
  menuName: string
  min: number
  max: number
  /** 계산에 쓰는 값. 배달비 포함 */
  avg: number
  deliveryFee: number
  sampleSize: number
  surveyedOn: string
}

export interface Totals {
  /** 재료비 합계 (소모 원가) — 매장가와 비교하는 숫자 */
  ingredientTotal: number
  /** 장바구니 금액 — 최소 판매 단위로 다 샀을 때 */
  basketTotal: number
  /** ingredientTotal / servings, 반올림 */
  perServing: number
  /** max(store.avg − ingredientTotal, 0). 음수를 표시하지 않는다 */
  savings: number
  /** 소수점 한 자리 */
  savingsPercent: number
  /** 해먹는 막대 채움 %. 0~100 */
  barPercent: number
}

export interface Warnings {
  /**
   * 가격을 못 찾은 **주재료** 이름들.
   * NFR-04 — 하나라도 있으면 r1·r2 상단에 경고를 띄운다.
   * 주재료 하나가 빠지면 합계가 배 단위로 어긋난다 (PoC: 8,522 → 26,198원).
   */
  missingMain: string[]
  /** 가격을 못 찾은 조미료. 배지 생략 가능 */
  missingSeasoning: string[]
  /** 가격이 붙은 재료 중 추정치인 개수 */
  estimatedCount: number
  /** 가격이 붙은 재료 총수 — "8개 중 3개는 추정 가격입니다" */
  pricedCount: number
}
