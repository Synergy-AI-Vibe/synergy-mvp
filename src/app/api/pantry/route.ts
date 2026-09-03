/**
 * POST /api/pantry — 있는 재료로 메뉴 추천
 *
 * { ingredients: string[] } (1~5개) → PantryResponse
 * 메뉴 추론은 LLM, 금액은 PoC 가격 파이프라인이 담당합니다 (lib/pantry/recommend.ts).
 *
 * ⚠️ runtime = 'nodejs' 필수 — 가격 파이프라인이 node:fs·node:https 를 씁니다.
 *
 * ── 테스트 ──
 *   curl -X POST localhost:3000/api/pantry \
 *        -H 'content-type: application/json' -d '{"ingredients":["돼지고기","신김치","두부"]}'
 */

import type { PantryRequest, PantryResponse } from '@/types/pantry'
import { recommendMenus } from '@/lib/pantry/recommend'

export const runtime = 'nodejs'
/** LLM 재시도(지수 백오프)까지 감안 */
export const maxDuration = 60

const MAX_INGREDIENTS = 5
/** 화면 규칙: "10자까지". 서버도 한 번 본다 */
const MAX_NAME_LENGTH = 10

export async function POST(request: Request): Promise<Response> {
  let body: PantryRequest
  try {
    body = (await request.json()) as PantryRequest
  } catch {
    return json({ status: 'error', message: '요청을 읽지 못했어요.' }, 400)
  }

  const ingredients = Array.isArray(body.ingredients)
    ? [...new Set(body.ingredients.map((s) => String(s ?? '').trim()).filter(Boolean))]
    : []

  if (ingredients.length === 0 || ingredients.length > MAX_INGREDIENTS) {
    return json({ status: 'error', message: `재료를 1개부터 ${MAX_INGREDIENTS}개까지 골라주세요.` }, 400)
  }
  if (ingredients.some((n) => n.length > MAX_NAME_LENGTH)) {
    return json({ status: 'error', message: `재료 이름은 ${MAX_NAME_LENGTH}자까지 쓸 수 있어요.` }, 400)
  }

  try {
    const menus = await recommendMenus(ingredients)
    if (menus.length === 0) {
      return json({ status: 'error', message: '이 조합으로는 추천을 만들지 못했어요. 재료를 바꿔 다시 시도해 주세요.' }, 502)
    }
    return json({ status: 'success', menus })
  } catch (e) {
    const err = e as Error & { cause?: { code?: string; message?: string } }
    console.error('[api/pantry]', err.message, err.cause?.code ?? err.cause?.message ?? '')
    return json({ status: 'error', message: '추천을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.' }, 502)
  }
}

function json(payload: PantryResponse, status = 200): Response {
  return Response.json(payload, { status })
}
