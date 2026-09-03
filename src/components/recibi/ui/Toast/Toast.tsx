"use client";

import { useRecibiApp } from "@/context/RecibiAppContext";
import styles from "./Toast.module.css";

/** 부품 19 — 토스트. 완료 알림 전용, 2,600ms 뒤 자동으로 사라짐 (02_동작규칙 1-4) */
export function Toast() {
  const { toast } = useRecibiApp();
  if (!toast) return null;

  return (
    <div className={styles.wrap}>
      <div className={styles.toast} role="status" aria-live="polite">
        {toast}
      </div>
    </div>
  );
}
