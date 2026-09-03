/**
 * POST /api/account/delete — 회원탈퇴 (6-4)
 *
 * 전용 화면에서 부릅니다(a3, 모달 아님). 되돌릴 수 없습니다.
 *
 * 연쇄 처리 — auth.users 를 지우면 DB 제약이 알아서 정리합니다
 *   profiles  → 삭제 (cascade)
 *   bookmark  → 삭제 (cascade)
 *
 * ⚠️ 클라이언트가 보낸 userId 를 쓰면 안 됩니다. 남의 계정을 지울 수 있습니다.
 *    서버가 세션에서 직접 확인한 id만 씁니다.
 */

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

export async function POST(): Promise<Response> {
  const supabase = await createClient()

  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) {
    return Response.json({ ok: false, message: '로그인이 필요해요.' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { error } = await admin.auth.admin.deleteUser(user.id)

  if (error) {
    console.error('[account/delete]', error.message)
    return Response.json(
      { ok: false, message: '탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.' },
      { status: 500 }
    )
  }

  await supabase.auth.signOut()
  return Response.json({ ok: true })
}
