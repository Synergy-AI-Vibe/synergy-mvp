/**
 * price/index.js 의 타입 경계 (구현은 JS 그대로 — analyze.d.ts 와 같은 방식).
 * TS 에서 실제로 쓰는 것만 선언합니다.
 */

/** 표준 품목명 목록 (시드 ∪ KAMIS 매핑, '물' 제외) */
export const CANONICAL_LIST: string[]

/** 규칙(정규식 ALIASES + 표준명 일치)만으로 정규화. 실패 시 null */
export function canonicalize(name: string): string | null

export function kamisStatus(): {
  tried: boolean
  ok: boolean
  regday: string | null
  itemCount: number
  error: string | null
  configured: boolean
}

export interface PriceItemInput {
  name: string
  qty?: number | null
  unit?: string | null
  amount?: { value: number; base: 'g' | 'ml' | 'ea'; basis?: string } | null
  [key: string]: unknown
}

export interface PricedItem {
  name: string
  canonical: string | null
  category: string
  cost: number | null
  packCost: number | null
  pack?: { size: number; unit: string; price: number; label: string } | null
  priceSource: {
    tier: 1 | 2 | 3
    name: string
    asOf: string | null
    per: 'g' | 'ml' | 'ea'
    unitPrice: number
    live: boolean
  } | null
  issues: { code: string; level: string; message: string }[]
  [key: string]: unknown
}

export function priceItem(
  item: PriceItemInput,
  overrides?: Record<string, unknown>,
  canonicalMap?: Map<string, string | null> | null
): Promise<PricedItem>
