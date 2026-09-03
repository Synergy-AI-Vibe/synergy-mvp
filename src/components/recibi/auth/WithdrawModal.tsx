"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { defaultExtractedRecipeId } from "@/lib/data/recibi/recipes";
import { Modal } from "@/components/recibi/ui/Modal/Modal";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";

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
    <Modal open={open} title="정말 탈퇴하시겠어요?" onClose={closeModal}>
      <p className="mb-[22px] text-[13.5px] leading-[1.8] text-text-2">
        저장한 북마크 {bookmarks.length}개가 모두 삭제되고 되돌릴 수 없습니다.
      </p>

      <div className="flex flex-wrap gap-2.5">
        <Button variant="accent" className="px-[30px]" onClick={handleWithdraw} disabled={isPending}>
          {isPending ? "처리 중" : "탈퇴하기"}
        </Button>
        <ButtonGhost className="px-[30px]" onClick={closeModal} disabled={isPending}>
          취소
        </ButtonGhost>
      </div>
    </Modal>
  );
}
