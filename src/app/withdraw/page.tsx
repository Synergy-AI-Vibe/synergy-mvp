"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import styles from "./page.module.css";

// a3 회원탈퇴 확인. 취소·돌아가기는 온 곳(next)으로, 탈퇴 성공은 홈으로 이동한다 —
// 이전엔 "결과 화면으로 이동"이었지만 실제 백엔드는 고정된 기본 레시피가 없어 홈으로 대체했다.
function WithdrawForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, bookmarks, showToast } = useRecibiApp();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const next = searchParams.get("next") || "/";

  useEffect(() => {
    if (!isLoggedIn) router.replace("/");
  }, [isLoggedIn, router]);

  async function handleWithdraw() {
    if (isPending) return;
    setIsPending(true);
    setError(null);
    const res = await fetch("/api/account/delete", { method: "POST" });
    const data = await res.json();
    if (!data.ok) {
      setIsPending(false);
      setError(data.message || "탈퇴 처리에 실패했어요. 잠시 후 다시 시도해 주세요.");
      return;
    }
    showToast("탈퇴가 완료되었습니다.");
    router.refresh(); // 서버가 준 로그인 상태(user)를 다시 동기화한다
    router.push("/");
  }

  if (!isLoggedIn) return null;

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.form}>
        <h1 className={styles.title}>회원탈퇴</h1>
        <p className={styles.desc}>저장한 북마크 {bookmarks?.length ?? 0}개가 모두 삭제되고 되돌릴 수 없습니다.</p>

        {error && <p className={styles.error}>{error}</p>}

        <div className={styles.actions}>
          <Button variant="accent" onClick={handleWithdraw} disabled={isPending}>
            {isPending ? "처리 중" : "탈퇴하기"}
          </Button>
          <ButtonGhost onClick={() => router.push(next)} disabled={isPending}>
            취소
          </ButtonGhost>
        </div>
      </div>
    </section>
  );
}

export default function WithdrawPage() {
  return (
    <main>
      <Suspense fallback={null}>
        <WithdrawForm />
      </Suspense>
    </main>
  );
}
