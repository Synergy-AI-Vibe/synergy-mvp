"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useRecibiApp, useHasMounted } from "@/context/RecibiAppContext";
import { defaultExtractedRecipeId } from "@/lib/data/recibi/recipes";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import styles from "./page.module.css";

// a3 회원탈퇴 확인. 취소·돌아가기는 온 곳(next)으로, 탈퇴 성공은 결과 화면으로 (02_동작규칙 12항 F4)
function WithdrawForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { isLoggedIn, bookmarks, withdraw } = useRecibiApp();
  const hasMounted = useHasMounted();
  const [isPending, setIsPending] = useState(false);

  const next = searchParams.get("next") || "/";

  useEffect(() => {
    if (hasMounted && !isLoggedIn) router.replace("/");
  }, [hasMounted, isLoggedIn, router]);

  async function handleWithdraw() {
    if (isPending) return;
    setIsPending(true);
    await withdraw();
    router.replace(`/result/${defaultExtractedRecipeId}`);
  }

  if (!isLoggedIn) return null;

  return (
    <section className={`container ${styles.section}`}>
      <div className={styles.form}>
        <h1 className={styles.title}>회원탈퇴</h1>
        <p className={styles.desc}>
          저장한 북마크 {bookmarks.length}개가 모두 삭제되고 되돌릴 수 없습니다.
        </p>

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
