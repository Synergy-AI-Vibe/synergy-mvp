"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { defaultExtractedRecipeId } from "@/lib/data/recibi/recipes";
import { Modal } from "@/components/recibi/ui/Modal/Modal";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";
import styles from "./AuthModal.module.css";

// a3 회원탈퇴 확인. 취소·닫기는 보던 화면 그대로, 탈퇴 성공만 결과 화면으로 (02_동작규칙 12항 F4)
export function WithdrawModal() {
  const router = useRouter();
  const { modal, closeModal, isLoggedIn, bookmarks, withdraw } = useRecibiApp();
  const [isPending, setIsPending] = useState(false);

  const open = modal?.kind === "withdraw" && isLoggedIn;

  async function handleWithdraw() {
    if (isPending) return;
    setIsPending(true);
    try {
      await withdraw();
      closeModal();
      router.replace(`/result/${defaultExtractedRecipeId}`);
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Modal open={open} title="회원탈퇴" onClose={closeModal}>
      <p className={styles.desc}>
        저장한 북마크 {bookmarks.length}개가 모두 삭제되고 되돌릴 수 없습니다.
      </p>

      <div className={styles.actions}>
        <Button variant="accent" onClick={handleWithdraw} disabled={isPending}>
          {isPending ? "처리 중" : "탈퇴하기"}
        </Button>
        <ButtonGhost onClick={closeModal} disabled={isPending}>
          취소
        </ButtonGhost>
      </div>
    </Modal>
  );
}
