"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import type { ToastMessage } from "@/types/recibi";

// 로그인·로그아웃은 /auth/callback, /auth/signout이 풀 페이지 리다이렉트로 처리한다(§2) —
// 클라이언트 상태를 못 거치므로 완료 토스트를 ?toast= 쿼리로 실어 보낸다. 어느 페이지에
// 랜딩하든 여기서 한 번만 읽어 보여주고 주소에서 지운다.
const TOAST_MESSAGES: Record<string, ToastMessage> = {
  login: "카카오 계정으로 로그인했습니다.",
  logout: "로그아웃되었습니다.",
  login_failed: "카카오 인증에 실패했습니다. 다시 시도해 주세요.",
};

export function ToastFromQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { showToast } = useRecibiApp();
  const toastKey = searchParams.get("toast");

  useEffect(() => {
    if (!toastKey) return;
    const message = TOAST_MESSAGES[toastKey];
    if (message) showToast(message);

    const next = new URLSearchParams(searchParams);
    next.delete("toast");
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toastKey]);

  return null;
}
