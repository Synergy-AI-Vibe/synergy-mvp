/**
 * DELETE /api/bookmarks/:id   (5-3)
 * 확인 없이 즉시 삭제, 되돌리기 없음.
 */

import { deleteBookmark } from '@/lib/data/bookmark'

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
): Promise<Response> {
  const { id } = await params
  const numericId = Number(id)

  if (!Number.isInteger(numericId)) {
    return Response.json({ ok: false, message: '잘못된 요청이에요.' }, { status: 400 })
  }

  const ok = await deleteBookmark(numericId)
  return ok
    ? Response.json({ ok: true })
    : Response.json({ ok: false, message: '삭제하지 못했어요.' }, { status: 500 })
}
