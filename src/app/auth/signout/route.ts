/**
 * POST /auth/signout — 로그아웃 (6-3)
 *
 * 북마크 데이터는 지우지 않습니다.
 * GET이 아니라 POST로 받습니다 — 링크 프리페치로 실수 로그아웃되는 걸 막습니다.
 * FE는 <a> 가 아니라 <form method="post"> 로 부르세요.
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request): Promise<Response> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (user) await supabase.auth.signOut()

  // FE 완료 토스트용 — 리다이렉트라 클라이언트 상태를 못 거친다 (ToastFromQuery가 읽는다)
  const landing = new URL('/', request.url)
  landing.searchParams.set('toast', 'logout')
  return NextResponse.redirect(landing, { status: 303 })
}
