"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function KakaoLoginButton() {
  const [loading, setLoading] = useState(false);

  async function signInWithKakao() {
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        scopes: "profile_nickname", // 닉네임만 요청 — 이메일 등 추가 동의항목 불필요
      },
    });
    if (error) {
      alert(`카카오 로그인 실패: ${error.message}`);
      setLoading(false);
    }
    // 성공 시 카카오 페이지로 리다이렉트되므로 로딩 해제 불필요
  }

  return (
    <button
      onClick={signInWithKakao}
      disabled={loading}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] py-3 font-semibold text-[#191919] hover:brightness-95 disabled:opacity-50"
    >
      <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true">
        <path
          fill="#191919"
          d="M12 3C6.48 3 2 6.48 2 10.8c0 2.76 1.8 5.18 4.51 6.56l-.92 3.39c-.08.3.26.54.52.37l4.05-2.7c.6.08 1.21.13 1.84.13 5.52 0 10-3.48 10-7.75S17.52 3 12 3z"
        />
      </svg>
      {loading ? "카카오로 이동 중..." : "카카오로 시작하기"}
    </button>
  );
}
