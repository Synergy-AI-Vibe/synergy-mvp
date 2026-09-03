// 실제 카카오 OAuth 연동 (Supabase Auth).
// 02_동작규칙 6-1 "카카오 하나뿐" — signInWithOAuth가 카카오 인증 페이지로 이동시키고,
// 복귀는 /auth/callback 라우트가 인가 코드를 세션으로 교환해 처리한다.
// 외부 설정(카카오 앱 키·Redirect URI·동의항목, Supabase Provider, Vercel env)은 완료 상태.

import { createClient } from "@/lib/supabase/client";
import type { User } from "@/types/recibi";

/** 로그인 직후 복귀를 감지해 토스트를 1회만 띄우기 위한 플래그 (sessionStorage) */
export const PENDING_LOGIN_KEY = "recibi:pendingLogin";

/**
 * 카카오 로그인 시작 — 이 함수는 사용자를 카카오로 "떠나보내는" 역할까지만 한다.
 * 세션 생성은 /auth/callback에서, 상태 반영은 Context의 세션 동기화에서 일어난다.
 * @param next 로그인 완료 후 돌아갈 경로 (02_동작규칙 11항)
 */
export async function loginWithKakao(next: string = "/"): Promise<void> {
  const supabase = createClient();
  try {
    window.sessionStorage.setItem(PENDING_LOGIN_KEY, "1");
  } catch {
    // 플래그 저장 실패 시 토스트만 생략될 뿐 로그인은 정상 진행
  }
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "kakao",
    options: {
      redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });
  if (error) throw new Error(error.message);
  // 성공 시 브라우저가 카카오로 이동하므로 이 뒤의 코드는 실행을 보장받지 못한다
}

/** 현재 Supabase 세션의 사용자 → 앱 User로 변환 (세션 없으면 null) */
export async function getSessionUser(): Promise<User | null> {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const meta = user.user_metadata ?? {};
  const name =
    (meta.name as string) ??
    (meta.full_name as string) ??
    (meta.preferred_username as string) ??
    "카카오 사용자";
  return { name };
}

export async function logout(): Promise<void> {
  const supabase = createClient();
  await supabase.auth.signOut();
}

export async function withdrawAccount(): Promise<void> {
  // 실제 계정 삭제는 service_role 권한(서버)이 필요하다 — MVP에서는 로그아웃과 동일하게 처리.
  // 추후 /api/withdraw 라우트에서 admin.deleteUser로 구현할 자리.
  const supabase = createClient();
  await supabase.auth.signOut();
}
