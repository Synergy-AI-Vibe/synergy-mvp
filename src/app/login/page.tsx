// 로그인 페이지 — 비로그인: 카카오 버튼 / 로그인됨: 사용자 정보 + 로그아웃
import { createClient } from "@/lib/supabase/server";
import KakaoLoginButton from "./kakao-login-button";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const { error } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-6 font-sans">
      <h1 className="text-center text-2xl font-bold">Synergy 로그인</h1>

      {user ? (
        <div className="mt-8 rounded-xl border border-gray-200 p-6 text-center">
          {user.user_metadata?.avatar_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.user_metadata.avatar_url}
              alt="프로필"
              className="mx-auto h-16 w-16 rounded-full"
            />
          )}
          <p className="mt-3 font-semibold">
            {user.user_metadata?.name ?? user.user_metadata?.full_name ?? "카카오 사용자"}
          </p>
          <p className="mt-1 text-sm text-gray-500">{user.email ?? "이메일 미제공"}</p>
          <p className="mt-1 text-xs text-gray-400">provider: {user.app_metadata?.provider}</p>

          <form action="/auth/signout" method="post" className="mt-5">
            <button className="w-full rounded-lg border border-gray-300 py-2 text-sm hover:bg-gray-50">
              로그아웃
            </button>
          </form>
        </div>
      ) : (
        <div className="mt-8">
          <KakaoLoginButton />
          {error && (
            <p className="mt-3 rounded bg-red-50 p-2 text-center text-sm text-red-600">
              로그인에 실패했습니다. 다시 시도해주세요.
            </p>
          )}
        </div>
      )}
    </main>
  );
}
