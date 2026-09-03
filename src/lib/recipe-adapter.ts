/**
 * PoC 파이프라인 출력 → FE 계약(types/api.ts) 변환
 *
 * PoC 의 analyze() 는 자기 형태로 결과를 냅니다. FE 는 types/api.ts 를 보고
 * 화면을 만들고 있으므로, 그 사이를 여기서 맞춥니다.
 *
 * 이렇게 나눠 두면
 *   · PoC 코드를 손대지 않아도 됩니다 (홀드아웃 95%/91% 로직 보존)
 *   · FE 는 PoC 내부 구조를 몰라도 됩니다
 *   · 나중에 파이프라인을 바꿔도 이 파일만 고치면 됩니다
 *
 * PoC 에 없어서 여기서 채우는 것
 *   store   매장가 — PoC 에는 사용자 입력 input 하나뿐이라 DB 에서 가져옵니다
 *   totals  5.7 계산식 — calc.ts 로 계산합니다 (FE 재계산과 같은 함수)
 *   warnings 주재료 누락 · 추정치 개수 (NFR-04 · NFR-05)
 */

import type {
  AnalyzeResponse,
  AnalyzeData,
  IngredientRow,
  Recipe,
  PriceConfidence,
} from '@/types/api'
import { computeTotals, computeWarnings } from '@/lib/calc'
import { matchStorePrice } from '@/lib/data/store-price'

// PoC 출력 타입은 경계 선언(lib/recipe/analyze.d.ts)에 있습니다
import type { PocItem, PocPriceSource, PocResult } from '@/lib/recipe/analyze.js'

export type { PocResult }

// ── 변환 ────────────────────────────────────────────────────

export async function toAnalyzeResponse(
  poc: PocResult,
  input: { url?: string; text?: string }
): Promise<AnalyzeResponse> {
  const items = poc.pricing?.items ?? []

  // 원문은 구했는데 재료를 못 찾은 경우 — PoC 실측 35%.
  // 에러가 아니라 정상 경로입니다. h4 실패 카드로 갑니다 (2-4).
  if (!poc.fetched?.ok || items.length === 0) {
    return {
      status: 'no_recipe_found',
      videoTitle: poc.fetched?.title ?? null,
      thumbnailUrl: thumbnailFromUrl(input.url),
      message:
        poc.fetched?.message ??
        '영상에서 재료를 찾지 못했어요. 아래에 직접 적어주시면 바로 계산해 드릴게요.',
    }
  }

  const servings = poc.servings?.used ?? poc.pricing?.servings ?? 1
  const rows = items.map(toRow)

  const title = poc.fetched.title ?? ''
  const store = title ? await matchStorePrice(title) : null

  const recipe: Recipe = {
    title: title || '이름 없는 레시피',
    servings,
    sourceType: poc.fetched.source === 'manual' ? 'manual' : 'youtube',
    sourceUrl: input.url ?? null,
    thumbnailUrl: thumbnailFromUrl(input.url),
    channelName: poc.fetched.channel ?? null,
    // ⚠️ PoC 는 조리 단계를 추출하지 않습니다. r4(조리법)는 원문만 접어서 보여주세요.
    steps: [],
    rawText: poc.fetched.source === 'manual' ? null : poc.fetched.text || null,
  }

  const data: AnalyzeData = {
    recipe,
    ingredients: rows,
    store,
    totals: computeTotals(rows, store, servings),
    warnings: computeWarnings(rows),
    priceBaseDate: latestAsOf(items) ?? poc.priceMeta?.asOf ?? today(),
    normalize: poc.normalize ?? null,
  }

  return { status: 'success', data }
}

/**
 * 재료가 아닌 파싱 잔여물인가.
 *
 * 실코퍼스에서 "야채와 고기 준비하기", "준비" 같은 조리 단계 문장이
 * 재료로 잡혀 주재료 경고에 떴습니다. 사용자에게
 * "이 재료는 비교 금액에 포함되지 않았어요" 라고 뜨면 겁을 주는데,
 * 실제로는 빠진 재료가 아닙니다.
 *
 * 원칙적으로는 LLM 이 null 을 내면서 걸러 줍니다 (5.5 — "조리 단계나 문장 조각").
 * 이건 GEMINI_API_KEY 가 없을 때를 위한 값싼 안전망입니다.
 * 수량·단위가 하나도 없고 서술형 어미로 끝나는 것만 걸러서,
 * 진짜 재료(예: "후추 약간")를 잘못 숨기지 않습니다.
 */
function looksLikeArtifact(it: PocItem): boolean {
  if (it.canonical) return false
  // "준비 (2~3인분 기준)" — 인분 표기는 재료가 아니라 분량 헤더입니다
  if (it.unit === '인분') return true
  if (it.qty != null || it.unit) return false
  return /(하기|준비|방법|만들기|손질|밑간)$/.test(it.name.trim())
}

function toRow(it: PocItem, i: number): IngredientRow {
  const hasPrice = it.cost != null

  return {
    id: i + 1,
    // 원문 그대로. 매칭이 틀렸을 때 사용자에게 보여줄 값입니다
    rawText: it.raw,
    name: it.canonical,
    // PoC 의 category('주재료'/'조미료') 가 NFR-04 경고 여부를 가릅니다.
    // 파싱 잔여물은 조미료로 내려 경고 배지를 생략합니다
    role: it.category === '조미료' || looksLikeArtifact(it) ? 'seasoning' : 'main',

    qty: it.qty,
    unit: it.unit,
    amount: it.amount?.value ?? null,
    amountUnit: it.amount?.base ?? null,
    // "양파 1개 ≈ 200g 기준" — 지어내지 않고 근거를 그대로 노출합니다
    conversionNote: it.amount?.basis ?? it.amountIssue?.detail ?? null,
    // 환산이 안 되면 화면에 "확인 필요"
    needsConfirm: it.amount == null,

    unitCost: it.cost,
    packCost: it.packCost,
    packLabel: it.pack ? `${it.pack.label} ${it.pack.price.toLocaleString('ko-KR')}원` : null,

    priceTier: it.priceSource?.tier ?? null,
    priceConfidence: toConfidence(it.priceSource),
    hasPrice,

    checked: true,
    userPrice: null,
  }
}

/**
 * 실시세 / 추정치 구분 (NFR-05)
 *
 * PoC 의 priceSource.live 가 이 축을 이미 갖고 있습니다 —
 * KAMIS 응답에서 온 값이면 true, seed.js 스냅샷이면 false.
 * 시드는 실제 시세와 최대 165% 차이가 확인됐으므로(시금치 9 vs 23.89원/g)
 * 배지에서 반드시 구분해야 합니다.
 */
function toConfidence(src: PocPriceSource | null): PriceConfidence | null {
  if (!src) return null
  if (src.tier === 3) return 'user'
  return src.live ? 'actual' : 'estimate'
}

function latestAsOf(items: PocItem[]): string | null {
  let latest: string | null = null
  for (const it of items) {
    const d = it.priceSource?.asOf
    if (d && (latest === null || d > latest)) latest = d
  }
  return latest
}

function thumbnailFromUrl(url?: string): string | null {
  if (!url) return null
  const m = url.match(
    /(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/
  )
  return m ? `https://i.ytimg.com/vi/${m[1]}/hqdefault.jpg` : null
}

function today(): string {
  return new Date().toISOString().slice(0, 10)
}
