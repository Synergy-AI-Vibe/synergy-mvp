/**
 * 미들웨어용 세션 갱신 헬퍼.
 *
 * Server Component는 쿠키를 쓸 수 없어(주석 참고: src/lib/supabase/server.ts) 만료된 액세스
 * 토큰이 갱신돼도 저장되지 않을 수 있다. 요청마다 이 미들웨어가 먼저 실행되며 세션을 확인·
 * 갱신하고, 새 쿠키를 응답에 실어 보낸다 (Supabase 공식 Next.js SSR 가이드 표준 패턴).
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { Database } from '@/types/database'

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // getUser()가 필요하면 토큰을 갱신한다 — 그 결과가 위 setAll을 통해 응답 쿠키에 반영된다.
  await supabase.auth.getUser()

  return supabaseResponse
}
