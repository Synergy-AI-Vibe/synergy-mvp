"use client";

import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { Modal } from "@/components/recibi/ui/Modal/Modal";
import { KakaoButton } from "@/components/recibi/ui/KakaoButton/KakaoButton";

/**
 * a1 로그인. 카카오는 브라우저를 통째로 넘겼다가 /auth/callback으로 돌아오므로,
 * 모달이 떠 있던 화면을 next로 넘겨 인증이 끝나면 그 자리로 되돌아오게 한다 (6-1).
 */
export function LoginModal() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { modal, closeModal } = useRecibiApp();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = modal?.kind === "login";
  const fromResult = modal?.kind === "login" && modal.fromResult;

  async function handleLogin() {
    if (isPending) return;
    setIsPending(true);
    setError(null);

    const query = searchParams.toString();
    const next = query ? `${pathname}?${query}` : pathname;
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });

    // 성공하면 브라우저가 카카오로 떠나므로 여기로 돌아오지 않는다
    if (authError) {
      setIsPending(false);
      setError("카카오 인증을 시작하지 못했습니다. 다시 시도해 주세요.");
    }
  }

  return (
    <Modal open={open} title="카카오로 시작하기" onClose={closeModal}>
      <p className="mb-[22px] text-[13.5px] leading-[1.8] text-text-2">
        {fromResult
          ? "이 레시피를 북마크하려면 로그인이 필요합니다."
          : "계산한 레시피를 북마크에 저장하고 이어서 볼 수 있습니다."}
      </p>

      {error && <p className="mb-3 text-[12.5px] leading-[1.75] text-accent">{error}</p>}

      <KakaoButton onClick={handleLogin} disabled={isPending}>
        {isPending ? "로그인 중" : "카카오로 3초 만에 시작하기"}
      </KakaoButton>

      <p className="mt-[14px] text-[12.5px] leading-[1.75] text-text-2">
        계속하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.
      </p>
    </Modal>
  );
}
