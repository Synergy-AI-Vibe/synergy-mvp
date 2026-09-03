/**
 * GET /auth/callback — 카카오 로그인 후 착륙 지점 (6-1)
 *
 * 인가 코드를 세션으로 교환합니다. 이 순간이 곧 가입입니다 —
 * auth.users 에 행이 생기고 트리거가 profiles 를 자동 생성합니다.
 *
 * ?next= 로 원래 있던 화면에 돌려보냅니다 (4.1 핵심 분기 3).
 */

import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET(request: Request): Promise<Response> {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/'

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) return NextResponse.redirect(`${origin}${next}`)
    console.error('[auth/callback]', error.message)
  }

  // 알림창을 쓰지 않습니다 (4.4) — 로그인 화면에서 문구로 표시합니다
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
