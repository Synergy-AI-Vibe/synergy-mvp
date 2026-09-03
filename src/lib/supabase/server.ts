/**
 * 서버 컴포넌트 / 라우트 핸들러용. 쿠키에서 세션을 읽으므로 RLS가 적용됩니다.
 * 북마크처럼 "본인 것만" 다뤄야 하는 곳에서 씁니다.
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Server Component 에서는 쿠키를 쓸 수 없어 예외가 납니다.
            // 세션 갱신은 proxy 가 담당하므로 무시해도 안전합니다.
          }
        },
      },
    }
  )
}
