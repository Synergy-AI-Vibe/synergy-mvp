/**
 * 브라우저(클라이언트 컴포넌트)용. RLS가 적용됩니다.
 * FE에서 카카오 로그인·북마크 조작에 씁니다.
 */

import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/database'

export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
  )
}
