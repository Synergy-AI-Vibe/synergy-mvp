/**
 * 북마크 — 본인 것만. RLS가 걸려 있어 server 클라이언트(publishable)를 씁니다.
 *
 * 금액은 저장하지 않습니다. 여는 시점 가격으로 재계산합니다 (5-4).
 * 5개 한도는 DB 트리거가 막습니다 — 앱에서 세면 동시 요청 시 뚫립니다.
 */

import 'server-only'
import { createClient } from '@/lib/supabase/server'

export const BOOKMARK_LIMIT = 5

export interface BookmarkRow {
  id: number
  title: string
  sourceType: 'youtube' | 'manual'
  sourceUrl: string | null
  servings: number
  createdAt: string
}

export async function listBookmarks(): Promise<BookmarkRow[]> {
  const db = await createClient()
  const { data, error } = await db
    .from('bookmark')
    .select('id, title, source_type, source_url, servings, created_at')
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)

  return (data ?? []).map((r) => ({
    id: r.id,
    title: r.title,
    sourceType: r.source_type,
    sourceUrl: r.source_url,
    servings: r.servings,
    createdAt: r.created_at,
  }))
}

export type CreateResult =
  | { ok: true; bookmark: BookmarkRow }
  | { ok: false; reason: 'limit' | 'duplicate' | 'unauthorized' | 'error'; message: string }

export async function createBookmark(input: {
  title: string
  sourceType: 'youtube' | 'manual'
  sourceUrl: string | null
  servings: number
}): Promise<CreateResult> {
  const db = await createClient()

  const { data: { user } } = await db.auth.getUser()
  if (!user) return { ok: false, reason: 'unauthorized', message: '로그인이 필요해요.' }

  const { data, error } = await db
    .from('bookmark')
    .insert({
      user_id: user.id,
      title: input.title,
      source_type: input.sourceType,
      source_url: input.sourceUrl,
      servings: input.servings,
    })
    .select('id, title, source_type, source_url, servings, created_at')
    .single()

  if (error) {
    // 트리거가 던지는 한도 초과 (b3 화면으로 보냅니다)
    if (error.message.includes('최대 5개')) {
      return { ok: false, reason: 'limit', message: error.message }
    }
    // 같은 영상을 이미 저장함
    if (error.code === '23505') {
      return { ok: false, reason: 'duplicate', message: '이미 저장한 레시피예요.' }
    }
    return { ok: false, reason: 'error', message: error.message }
  }

  return {
    ok: true,
    bookmark: {
      id: data.id,
      title: data.title,
      sourceType: data.source_type,
      sourceUrl: data.source_url,
      servings: data.servings,
      createdAt: data.created_at,
    },
  }
}

/** 확인 없이 즉시 삭제, 되돌리기 없음 (5-3) */
export async function deleteBookmark(id: number): Promise<boolean> {
  const db = await createClient()
  const { error } = await db.from('bookmark').delete().eq('id', id)
  if (error) {
    console.warn('[deleteBookmark]', error.message)
    return false
  }
  return true
}
