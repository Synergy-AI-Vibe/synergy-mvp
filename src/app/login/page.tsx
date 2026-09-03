"use client";

import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { KakaoButton } from "@/components/recibi/ui/KakaoButton/KakaoButton";
import { TextLink } from "@/components/recibi/ui/TextLink/TextLink";
import styles from "./page.module.css";

// a1 로그인. backView는 ?next= 로 기억해 /auth/callback이 인증 후 그리로 돌려보낸다 (6-1)
function LoginForm() {
  const searchParams = useSearchParams();
  const [isPending, setIsPending] = useState(false);

  const next = searchParams.get("next") || "/";
  const authFailed = searchParams.get("error") === "auth_failed";
  const fromResult = next.startsWith("/result");

  async function handleLogin() {
    if (isPending) return;
    setIsPending(true);
    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "kakao",
      options: { redirectTo },
    });
    if (error) setIsPending(false); // 성공하면 브라우저가 카카오로 이동하므로 되돌아올 일이 없다
  }

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.form}>
        <h1 className={styles.title}>로그인</h1>
        <p className={styles.desc}>
          {fromResult
            ? "이 레시피를 북마크하려면 로그인이 필요합니다."
            : "계산한 레시피를 북마크에 저장하고 이어서 볼 수 있습니다."}
        </p>

        {authFailed && <p className={styles.error}>카카오 인증에 실패했습니다. 다시 시도해 주세요.</p>}

        <KakaoButton onClick={handleLogin} disabled={isPending}>
          {isPending ? "로그인 중" : "카카오로 로그인"}
        </KakaoButton>

        <p className={styles.legal}>계속하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.</p>

        <div className={styles.back}>
          <TextLink href={next}>← 돌아가기</TextLink>
        </div>
      </div>
    </section>
  );
}

export default function LoginPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
