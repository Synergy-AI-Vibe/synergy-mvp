/**
 * GET  /api/bookmarks   목록 (5-2)
 * POST /api/bookmarks   저장 (5-1)
 *
 * ⚠️ 목록에 금액을 넣지 마세요.
 *    5건의 금액을 보여주려면 /api/analyze 를 5번 부릅니다.
 *    PoC 실측 4.3초 기준 목록 하나에 20초고, 유튜브 API 할당량도 5배입니다.
 *    제목·인분수만 주고, 행을 클릭해 r1 로 들어갈 때 계산합니다 (5-4).
 */

import { listBookmarks, createBookmark, BOOKMARK_LIMIT } from '@/lib/data/bookmark'

export async function GET(): Promise<Response> {
  try {
    const items = await listBookmarks()
    return Response.json({ ok: true, items, count: items.length, limit: BOOKMARK_LIMIT })
  } catch (e) {
    console.error('[GET /api/bookmarks]', e)
    return Response.json({ ok: false, message: '북마크를 불러오지 못했어요.' }, { status: 500 })
  }
}

export async function POST(request: Request): Promise<Response> {
  let body: {
    title?: string
    sourceType?: 'youtube' | 'manual'
    sourceUrl?: string | null
    servings?: number
  }
  try {
    body = await request.json()
  } catch {
    return Response.json({ ok: false, message: '요청을 읽지 못했어요.' }, { status: 400 })
  }

  if (!body.title || !body.sourceType) {
    return Response.json({ ok: false, message: '필수 값이 빠졌어요.' }, { status: 400 })
  }

  const result = await createBookmark({
    title: body.title,
    sourceType: body.sourceType,
    sourceUrl: body.sourceUrl ?? null,
    servings: body.servings ?? 1,
  })

  if (result.ok) return Response.json({ ok: true, bookmark: result.bookmark })

  const status =
    result.reason === 'unauthorized' ? 401 :
    result.reason === 'limit' ? 409 :
    result.reason === 'duplicate' ? 409 : 500

  // reason 으로 FE가 분기합니다 — limit → b3, unauthorized → a1
  return Response.json({ ok: false, reason: result.reason, message: result.message }, { status })
}
