"use client";

import { useState } from "react";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { Modal } from "@/components/recibi/ui/Modal/Modal";
import { KakaoButton } from "@/components/recibi/ui/KakaoButton/KakaoButton";

// a1 로그인. 화면 이동이 없으므로 돌아갈 곳(?next=)을 따로 기억할 필요가 없다 —
// 모달을 닫으면 그대로 원래 보던 화면이다 (02_동작규칙 11항).
export function LoginModal() {
  const { modal, closeModal, login } = useRecibiApp();
  const [isPending, setIsPending] = useState(false);

  const open = modal?.kind === "login";
  const fromResult = modal?.kind === "login" && modal.fromResult;

  async function handleLogin() {
    if (isPending) return;
    setIsPending(true);
    try {
      await login();
      closeModal();
    } finally {
      setIsPending(false);
    }
  }

  return (
    <Modal open={open} title="로그인" onClose={closeModal}>
      <p className="mb-[22px] text-[13.5px] leading-[1.8] text-text-2">
        {fromResult
          ? "이 레시피를 북마크하려면 로그인이 필요합니다."
          : "계산한 레시피를 북마크에 저장하고 이어서 볼 수 있습니다."}
      </p>

      <KakaoButton onClick={handleLogin} disabled={isPending}>
        {isPending ? "로그인 중" : "카카오로 로그인"}
      </KakaoButton>

      <p className="mt-[14px] text-[12.5px] leading-[1.75] text-text-2">계속하면 이용약관과 개인정보 처리방침에 동의하는 것으로 봅니다.</p>
    </Modal>
  );
}
