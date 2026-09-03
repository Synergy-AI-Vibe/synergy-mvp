/**
 * 있는 재료로 찾기 — LLM 메뉴 추천 + 추가 구매비 계산
 *
 * 역할 분담이 핵심입니다:
 *   · LLM(Gemini)      "이 재료로 뭘 만들 수 있고, 뭘 더 사야 하나" — 추론만
 *   · PoC 가격 파이프라인  추가 재료의 실제 가격(KAMIS 실시세 → 시드) — 금액은 여기서만
 * LLM 이 금액을 지어내지 못하도록 스키마에 가격 필드 자체를 두지 않습니다.
 *
 * 설계 원칙 (llm-normalize.js 를 따름)
 *   · 요청당 LLM 호출 한 번 (메뉴마다 부르지 않는다)
 *   · LLM 이 죽으면 에러를 올리고, 라우트가 한국어 안내로 바꾼다 — 금액을 지어내지 않는다
 *   · usedIngredients 는 입력의 부분집합만 인정 (환각 방지의 마지막 방어선)
 *   · 같은 재료 조합은 메모리 캐시 (서버리스 인스턴스 수명 동안)
 */

import 'server-only'
import { pickModels, generateJsonWithRetry } from '@/lib/recipe/llm/gemini.js'
import { canonicalize, priceItem } from '@/lib/recipe/price/index.js'
import type { PantryExtraIngredient, PantryMenu } from '@/types/pantry'

const MENU_COUNT = 4
const MAX_EXTRAS_PER_MENU = 8

const SYSTEM = `당신은 집에 있는 재료로 만들 요리를 추천하는 요리사입니다.

규칙:
- 요리 장르에 제한이 없습니다. 한식·양식·중식·일식 어느 쪽이든 보유 재료에 가장 잘 맞는 메뉴를 고르세요.
- 메뉴는 ${MENU_COUNT}개, 서로 다른 요리로 추천합니다.
- uses 에는 "보유 재료" 목록에 있는 표기만, 그대로 적습니다. 목록에 없는 재료를 uses 에 넣지 마세요.
- extras 에는 **그 메뉴의 일반적인 레시피에 들어가는 주요 재료 가운데 보유 재료 목록에 없는 것을 전부** 적습니다.
  보유 재료만 보고 "이걸로 충분하다"고 좁히지 말고, 표준 레시피를 기준으로 부족한 재료를 빠짐없이 알려주세요.
  (예: 김치찌개인데 두부·양파가 목록에 없으면 extras 에 두부, 양파를 적습니다) 메뉴당 최대 ${MAX_EXTRAS_PER_MENU}개.
- 어느 집에나 있는 기본 조미료(소금·후추·설탕·간장·식용유·참기름·물)만 extras 에서 제외합니다.
  고춧가루·고추장·된장·굴소스 같은 장류·특수 조미료는 레시피에 필요하면 extras 에 포함합니다.
- 재료명은 브랜드 없이 일반 명사로 적습니다. (예: "오뚜기 카레가루" → "카레가루")
- description 은 이 재료 조합에서 왜 이 메뉴인지 한 문장으로 씁니다.
- 표준 레시피의 주요 재료가 보유 재료로 전부 해결될 때만 extras 를 빈 배열로 두세요.`

const SCHEMA = {
  type: 'OBJECT' as const,
  properties: {
    menus: {
      type: 'ARRAY',
      items: {
        type: 'OBJECT',
        properties: {
          name: { type: 'STRING', description: '메뉴 이름' },
          description: { type: 'STRING', description: '한 문장 설명' },
          uses: { type: 'ARRAY', items: { type: 'STRING' }, description: '보유 재료 중 쓰는 것 (그대로)' },
          extras: {
            type: 'ARRAY',
            items: { type: 'STRING' },
            description: '일반적인 레시피 기준, 보유 목록에 없어 사야 하는 주요 재료 전부',
          },
        },
        required: ['name', 'description', 'uses', 'extras'],
      },
    },
  },
  required: ['menus'],
}

interface LlmMenus {
  menus?: { name?: string; description?: string; uses?: string[]; extras?: string[] }[]
}

// 모델은 프로세스당 한 번만 고른다 (normalize.js 와 같은 패턴).
// 추천은 lite 급이면 충분하고, 무료 티어 쿼터가 stable flash 보다 넉넉해서
// 폴백 목록에서 lite 계열을 우선한다 (모델명 하드코딩 없이 pickModels 로).
let modelPromise: Promise<string> | null = null
function defaultModel(): Promise<string> {
  if (!modelPromise) {
    modelPromise = pickModels()
      .then((names) => names.find((n) => /lite/i.test(n)) ?? names[0])
      .catch((e) => {
        modelPromise = null // 일시 오류면 다음 요청에서 다시 시도
        throw e
      })
  }
  return modelPromise
}

// 같은 조합 재요청은 LLM 을 다시 부르지 않는다 — 시연 반복에도 유리
const cache = new Map<string, PantryMenu[]>()
const CACHE_MAX = 50

export async function recommendMenus(rawIngredients: string[]): Promise<PantryMenu[]> {
  const ingredients = [...new Set(rawIngredients.map((s) => s.trim()).filter(Boolean))]
  const key = [...ingredients].sort().join('|')

  const hit = cache.get(key)
  if (hit) return hit

  const model = await defaultModel()
  const user = `## 보유 재료\n${ingredients.map((n, i) => `${i + 1}. ${n}`).join('\n')}`

  const { data } = await generateJsonWithRetry<LlmMenus>(
    { model, system: SYSTEM, user, schema: SCHEMA, timeout: 60000 },
    { attempts: 2 } // 무료 티어 쿼터를 아낀다 — 429 를 4번씩 두드리지 않는다
  )

  const owned = new Set(ingredients)
  const menus: { name: string; description: string; uses: string[]; extras: string[] }[] = []
  for (const m of data?.menus ?? []) {
    const name = String(m?.name ?? '').trim()
    if (!name) continue
    menus.push({
      name,
      description: String(m?.description ?? '').trim(),
      // 입력에 없는 표기를 uses 로 만들어냈으면 버린다
      uses: (m?.uses ?? []).map((s) => String(s).trim()).filter((s) => owned.has(s)),
      extras: [...new Set((m?.extras ?? []).map((s) => String(s).trim()).filter(Boolean))].slice(
        0,
        MAX_EXTRAS_PER_MENU
      ),
    })
  }

  // 추가 재료 가격은 메뉴를 가로질러 재료당 한 번만 푼다
  const priced = new Map<string, PantryExtraIngredient>()
  for (const extra of new Set(menus.flatMap((m) => m.extras))) {
    priced.set(extra, await priceExtra(extra))
  }

  const result: PantryMenu[] = menus
    .map((m) => {
      const extraIngredients = m.extras.map((e) => priced.get(e)!)
      return {
        name: m.name,
        description: m.description,
        usedIngredients: m.uses,
        extraIngredients,
        extraCost: extraIngredients.reduce((s, e) => s + (e.packCost ?? 0), 0),
        unpricedCount: extraIngredients.filter((e) => !e.hasPrice).length,
      }
    })
    // "추가로 사야 하는 금액 순". 금액이 같으면 가격 미확인이 적은 쪽 먼저
    .sort((a, b) => a.extraCost - b.extraCost || a.unpricedCount - b.unpricedCount)

  if (result.length) {
    if (cache.size >= CACHE_MAX) cache.delete(cache.keys().next().value!)
    cache.set(key, result)
  }
  return result
}

/**
 * 추가 재료 하나의 "사야 하는 금액" = 최소 구매 단위(pack) 가격.
 * 소모량 기준이 아니라 실제로 장바구니에 담기는 금액입니다 (서비스 차별점과 같은 관점).
 * 수량을 모르므로 명목 amount 로 pack 정보만 끌어내고 cost 는 쓰지 않습니다.
 */
async function priceExtra(name: string): Promise<PantryExtraIngredient> {
  const canonical = canonicalize(name)
  if (!canonical) {
    return { name, canonical: null, packCost: null, packLabel: null, priceConfidence: null, hasPrice: false }
  }

  const p = await priceItem({ name, qty: null, unit: null, amount: { value: 1, base: 'g' } })
  const pack = p.pack ?? null
  return {
    name,
    canonical,
    packCost: pack ? pack.price : null,
    packLabel: pack ? `${pack.label} ${pack.price.toLocaleString('ko-KR')}원` : null,
    priceConfidence: p.priceSource ? (p.priceSource.live ? 'actual' : 'estimate') : null,
    hasPrice: pack != null,
  }
}
