"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { KakaoButton } from "@/components/recibi/ui/KakaoButton/KakaoButton";
import { TextLink } from "@/components/recibi/ui/TextLink/TextLink";
import styles from "./page.module.css";

// a1 로그인. backView는 ?next= 로 기억한다 (02_동작규칙 11항 "되돌아갈 곳을 기억해야 합니다")
function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useRecibiApp();
  const [isPending, setIsPending] = useState(false);

  const next = searchParams.get("next") || "/";
  const fromResult = next.startsWith("/result/");

  async function handleLogin() {
    if (isPending) return;
    setIsPending(true);
    await login();
    router.replace(next);
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
