"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { Modal } from "@/components/recibi/ui/Modal/Modal";
import { Button } from "@/components/recibi/ui/Button/Button";
import { ButtonGhost } from "@/components/recibi/ui/ButtonGhost/ButtonGhost";

// a3 회원탈퇴 확인. 취소·닫기는 보던 화면 그대로, 탈퇴 성공은 홈으로 —
// 실제 백엔드에는 고정된 기본 레시피가 없어 시안의 "결과 화면으로"를 홈으로 대체했다.
export function WithdrawModal() {
  const router = useRouter();
  const { modal, closeModal, isLoggedIn, bookmarks, showToast } = useRecibiApp();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const open = modal?.kind === "withdraw" && isLoggedIn;
  const savedCount = bookmarks?.length ?? 0;

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
    closeModal();
    router.refresh(); // 서버가 준 로그인 상태(user)를 다시 동기화한다
    router.push("/");
  }

  return (
    <Modal open={open} title="정말 탈퇴하시겠어요?" onClose={closeModal}>
      <p className="mb-[22px] text-[13.5px] leading-[1.8] text-text-2">
        저장한 북마크 {savedCount}개가 모두 삭제되고 되돌릴 수 없습니다.
      </p>

      {error && <p className="mb-3 text-[12.5px] leading-[1.75] text-accent">{error}</p>}

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
