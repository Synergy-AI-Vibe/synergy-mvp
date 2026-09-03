/**
 * 금액 계산 — BE·FE 공용
 * ------------------------------------------------------------
 * ⚠️ 이 파일이 계산식의 유일한 출처입니다.
 *
 *    서버가 초기 1회 계산하고, 이후 재료 조정(체크 해제·금액 입력)은
 *    화면에서 다시 계산합니다(5.1). 같은 공식이 양쪽에 필요한데,
 *    각자 구현하면 새로고침했을 때 금액이 달라집니다.
 *
 *    그래서 순수 함수로만 둡니다 — Supabase도 React도 import 하지 않습니다.
 *    BE 라우트와 FE 컴포넌트가 이 파일을 같이 import 합니다.
 *
 * 소유자: BE. 여기를 고치면 반드시 FE에 알립니다.
 */

import type { IngredientRow, StorePrice, Totals, Warnings } from '@/types/api'

/** 빈 값과 0은 같게 다룹니다 (5.7) */
const num = (v: number | null | undefined): number =>
  typeof v === 'number' && Number.isFinite(v) ? v : 0

/**
 * 재료 한 줄이 재료비 합계에 더하는 금액.
 *
 * 가격이 있는 재료  → 소모 원가
 * 가격이 없는 재료  → 사용자가 직접 넣은 금액 (안 넣었으면 0)
 */
export function rowIngredientCost(row: IngredientRow): number {
  if (!row.checked) return 0
  return row.hasPrice ? num(row.unitCost) : num(row.userPrice)
}

/**
 * 재료 한 줄이 장바구니 금액에 더하는 금액.
 *
 * 가격이 있는 재료  → 구매 단위 가격
 * 가격이 없는 재료  → 사용자가 직접 넣은 금액 (동일)
 */
export function rowBasketCost(row: IngredientRow): number {
  if (!row.checked) return 0
  return row.hasPrice ? num(row.packCost) : num(row.userPrice)
}

/**
 * 5.7 계산식 그대로.
 *
 *   재료비 합계 = Σ(체크된 재료의 원가) + (가격없는 재료가 체크됨 ? 직접입력액 : 0)
 *   장바구니    = Σ(체크된 재료의 구매단위가격) + (동일)
 *   절약        = max(사먹는가격 − 재료비합계, 0)      // 음수를 표시하지 않음
 *   퍼센트      = (절약 ÷ 사먹는가격 × 100) 소수점 1자리
 *   막대 채움   = min(재료비합계 ÷ 사먹는가격 × 100, 100)
 *   1인분       = round(재료비합계 ÷ 인분수)
 */
export function computeTotals(
  rows: IngredientRow[],
  store: StorePrice | null,
  servings: number
): Totals {
  const ingredientTotal = rows.reduce((s, r) => s + rowIngredientCost(r), 0)
  const basketTotal = rows.reduce((s, r) => s + rowBasketCost(r), 0)

  const safeServings = servings > 0 ? servings : 1
  const perServing = Math.round(ingredientTotal / safeServings)

  // 매장가가 없으면 비교 자체가 성립하지 않는다 → 0으로 두고 화면에서 영역을 접는다
  const storeAvg = store ? num(store.avg) : 0

  const savings = storeAvg > 0 ? Math.max(storeAvg - ingredientTotal, 0) : 0
  const savingsPercent = storeAvg > 0 ? round1((savings / storeAvg) * 100) : 0
  const barPercent = storeAvg > 0 ? round1(Math.min((ingredientTotal / storeAvg) * 100, 100)) : 0

  return { ingredientTotal, basketTotal, perServing, savings, savingsPercent, barPercent }
}

/**
 * 경고 집계.
 *
 * NFR-04 — 주재료가 가격 매칭에 실패하면 상단 경고 필수.
 *          조미료는 생략 가능(소모량이 적어 금액 영향이 작다).
 *
 * estimatedCount 는 "8개 중 3개는 추정 가격입니다" 한 줄에 씁니다.
 * 커버리지 82% 중 실제 공공데이터가 45%뿐이고, 시드 오차가 최대 165%라
 * (시금치 9 vs 23.89원/g) 합계 하나만 보여주면 사용자가 그 값을 그대로 믿습니다.
 */
export function computeWarnings(rows: IngredientRow[]): Warnings {
  const missingMain: string[] = []
  const missingSeasoning: string[] = []
  let estimatedCount = 0
  let pricedCount = 0

  for (const r of rows) {
    if (!r.checked) continue

    if (!r.hasPrice && r.userPrice === null) {
      const label = r.name ?? r.rawText
      if (r.role === 'main') missingMain.push(label)
      else missingSeasoning.push(label)
      continue
    }

    pricedCount += 1
    if (r.priceConfidence === 'estimate') estimatedCount += 1
  }

  return { missingMain, missingSeasoning, estimatedCount, pricedCount }
}

// ============================================================
// 표시 형식 (4.4)
// ============================================================

/** 원 단위 정수 + 천 단위 쉼표 */
export function formatWon(v: number): string {
  return Math.round(v).toLocaleString('ko-KR')
}

/** 퍼센트는 소수점 한 자리 */
export function formatPercent(v: number): string {
  return v.toFixed(1)
}

function round1(v: number): number {
  return Math.round(v * 10) / 10
}
