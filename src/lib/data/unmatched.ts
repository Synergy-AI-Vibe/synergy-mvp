/**
 * 매칭 실패 수집 (5.5)
 *
 * LLM이 null 을 주면서 남긴 이유를 모읍니다.
 * "브랜드명을 제외한 춘장은 표준 품목 목록에 없습니다" 같은 응답이
 * 곧 가격 DB에 무엇을 추가해야 하는지 알려주는 목록이 됩니다.
 *
 *   select raw_name, hit_count, reason
 *   from unmatched_ingredient order by hit_count desc limit 20;
 */

import 'server-only'
import { createAdminClient } from '@/lib/supabase/admin'

export async function recordUnmatched(
  rawName: string,
  reason?: string | null,
  confidence?: number | null
): Promise<void> {
  const db = createAdminClient()
  const { error } = await db.rpc('record_unmatched', {
    p_raw_name: rawName,
        p_reason: reason ?? undefined,          // ✅
    p_confidence: confidence ?? undefined,  // ✅
  })
  // 수집 실패가 응답을 막으면 안 됩니다 — 로그만 남깁니다
  if (error) console.warn('[recordUnmatched]', rawName, error.message)
}

/** 여러 개를 한 번에. 실패해도 전체가 죽지 않습니다 */
export async function recordUnmatchedBatch(
  items: { rawName: string; reason?: string | null; confidence?: number | null }[]
): Promise<void> {
  await Promise.allSettled(
    items.map((i) => recordUnmatched(i.rawName, i.reason, i.confidence))
  )
}
