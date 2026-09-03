/**
 * POST /api/analyze
 *
 * PoC 파이프라인을 부르고, 결과를 FE 계약(types/api.ts)으로 변환합니다.
 *
 * ⚠️ runtime = 'nodejs' 는 필수입니다.
 *    PoC 의 env.js 가 node:fs, http.js 가 node:https 를 씁니다.
 *    Edge 런타임에는 이 모듈이 없어서 배포한 뒤에야 터집니다.
 *
 * USE_MOCK = true 인 동안에는 목 응답이 나갑니다.
 * FE 는 이 스위치와 무관하게 같은 형태를 받습니다.
 *
 * ── 테스트 ──
 *   curl -X POST localhost:3000/api/analyze \
 *        -H 'content-type: application/json' -d '{"url":"https://youtu.be/..."}'
 *   ?mock=notfound   추출 실패 (h4)
 *   ?mock=nostore    매장가 없음
 */

import type { AnalyzeRequest, AnalyzeResponse } from '@/types/api'
import { toAnalyzeResponse } from '@/lib/recipe-adapter'
import { MOCK_SUCCESS, MOCK_NOT_FOUND, MOCK_NO_STORE } from '@/lib/mock/analyze'

// PoC 는 JS(ESM) 입니다. tsconfig 의 allowJs 가 켜져 있어야 합니다 (Next 기본값 true).
import { analyze as pocAnalyze } from '@/lib/recipe/analyze.js'

export const runtime = 'nodejs'
/** 유튜브 + LLM 호출이 겹치면 10초를 넘길 수 있습니다 */
export const maxDuration = 60

/** 🔴 PoC 연결이 끝나면 false 로 */
const USE_MOCK = false

const YOUTUBE_URL =
  /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?|shorts\/|live\/)|youtu\.be\/|m\.youtube\.com\/)/i

export async function POST(request: Request): Promise<Response> {
  let body: AnalyzeRequest
  try {
    body = (await request.json()) as AnalyzeRequest
  } catch {
    return json({ status: 'error', code: 'INTERNAL', message: '요청을 읽지 못했어요.' }, 400)
  }

  const url = body.url?.trim()
  const text = body.text?.trim()

  if (!url && !text) {
    return json(
      { status: 'error', code: 'INVALID_URL', message: '유튜브 주소나 레시피를 입력해 주세요.' },
      400
    )
  }
  // 화면에서 이미 거르지만(2-2) 서버도 한 번 봅니다
  if (url && !text && !YOUTUBE_URL.test(url)) {
    return json({ status: 'error', code: 'INVALID_URL', message: '유튜브 주소 형식이 아니에요.' }, 400)
  }

  // ── 개발용 목 분기. 실제 연결이 끝나면 이 블록째로 삭제 ──
  const mock = new URL(request.url).searchParams.get('mock')
  if (mock === 'notfound') return json(MOCK_NOT_FOUND)
  if (mock === 'nostore') return json(MOCK_NO_STORE)
  if (USE_MOCK) return json(MOCK_SUCCESS)

  try {
    const poc = await pocAnalyze({ url, text })
    return json(await toAnalyzeResponse(poc, { url, text }))
  } catch (e) {
    const err = e as Error & { statusCode?: number }
    console.error('[api/analyze]', err.message)

    if (err.statusCode === 400) {
      return json({ status: 'error', code: 'INVALID_URL', message: err.message }, 400)
    }
    return json(
      { status: 'error', code: 'INTERNAL', message: '계산에 실패했어요. 잠시 후 다시 시도해 주세요.' },
      500
    )
  }
}

function json(payload: AnalyzeResponse, status = 200): Response {
  return Response.json(payload, { status })
}
