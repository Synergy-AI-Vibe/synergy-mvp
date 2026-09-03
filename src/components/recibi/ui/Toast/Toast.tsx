"use client";

import { useRecibiApp } from "@/context/RecibiAppContext";

/** 부품 19 — 토스트. 완료 알림 전용, 2,600ms 뒤 자동으로 사라짐 (02_동작규칙 1-4) */
export function Toast() {
  const { toast } = useRecibiApp();
  if (!toast) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-7 z-30 flex justify-center">
      <div
        className="bg-text px-[22px] py-[14px] text-[13.5px] font-medium text-on-ink shadow-toast"
        role="status"
        aria-live="polite"
      >
        {toast}
      </div>
    </div>
  );
}
