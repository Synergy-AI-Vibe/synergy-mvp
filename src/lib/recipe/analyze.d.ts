/**
 * PoC 파이프라인(JS)의 타입 경계.
 *
 * 구현은 analyze.js 그대로입니다(홀드아웃 95%/91% 검증본 — 지시서 1-1).
 * 이 파일은 TS 세계에서 부를 때의 시그니처만 선언합니다.
 * PoC 폴더를 다시 복사해 갱신해도 이 파일은 남습니다.
 *
 * ⚠️ 여기 타입은 "느슨한 서술"입니다. analyze.js 출력이 바뀌면
 *    컴파일러가 잡아주지 못하므로, 바뀐 걸 알게 되면 여기도 같이 고치세요.
 */

export interface PocAmount {
  value: number
  base: 'g' | 'ml' | 'ea'
  /** "양파 1개 ≈ 200g 기준" — 화면에 그대로 노출할 근거 */
  basis: string
}

export interface PocPriceSource {
  tier: 1 | 2 | 3
  name: string
  asOf: string | null
  per: 'g' | 'ml' | 'ea'
  unitPrice: number
  /** true 면 KAMIS 실시세, false 면 시드 추정치 */
  live: boolean
}

export interface PocItem {
  raw: string
  section: string | null
  name: string
  qty: number | null
  unit: string | null
  amount: PocAmount | null
  amountIssue: { reason: string; detail: string } | null
  confidence: string
  canonical: string | null
  priceSource: PocPriceSource | null
  cost: number | null
  packCost: number | null
  pack: { size: number; unit: string; price: number; label: string } | null
  category: string
  issues: { code: string; level: string; message: string }[]
}

export interface PocResult {
  servings: { used: number; source: string; detected: unknown }
  fetched: {
    ok: boolean
    source: string
    title: string | null
    channel: string | null
    reason: string | null
    message: string | null
    text: string
  }
  normalize?: {
    total: number
    rule: number
    cache: number
    llm: number
    missed: number
    /** LLM이 "재료 아님"으로 판정해 결과 행에서 제거된 수 */
    filtered?: number
    llmCalled: boolean
  }
  pricing: {
    items: PocItem[]
    servings: number
    summary: {
      consumedCost: number
      basketCost: number
      coverage: number
      criticalExcluded: string[]
    }
  }
  priceMeta: { asOf: string }
}

export interface AnalyzeInput {
  url?: string
  text?: string
  overrides?: Record<string, unknown>
  servings?: number | null
}

/** @throws 입력이 잘못되면 Error & { statusCode: 400 } */
export function analyze(input?: AnalyzeInput): Promise<PocResult>
