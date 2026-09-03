/**
 * llm-store-price.js 의 타입 경계. (analyze.d.ts 와 같은 목적)
 */

export interface LlmStorePrice {
  menuName: string
  min: number
  max: number
  avg: number
  deliveryFee: number
  sampleSize: number
  surveyedOn: string
}

export interface EstimateStorePriceOptions {
  model?: string
  sampleCount?: number
  timeout?: number
}

export function estimateStorePrice(
  menuTitle: string,
  opts?: EstimateStorePriceOptions
): Promise<LlmStorePrice | null>
