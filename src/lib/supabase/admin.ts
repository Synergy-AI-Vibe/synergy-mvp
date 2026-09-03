/**
 * ⚠️ 서버 전용. RLS를 우회합니다.
 *    클라이언트 컴포넌트에서 import 하면 빌드가 실패합니다 ('server-only').
 *
 * 마스터·가격 테이블에는 INSERT 정책을 만들지 않았습니다.
 * publishable 키로 쓰려고 하면 에러 없이 0행 처리되니,
 * 아래 쓰기는 전부 이 클라이언트로만 하세요.
 *   · price 적재 (KAMIS 배치)
 *   · ingredient_alias 캐시 (LLM 정규화 결과)
 *   · record_unmatched (매칭 실패 수집)
 *   · auth.admin.deleteUser (회원탈퇴)
 */

import 'server-only'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

let cached: ReturnType<typeof createClient<Database>> | null = null

export function createAdminClient() {
  if (cached) return cached
  cached = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  )
  return cached
}
