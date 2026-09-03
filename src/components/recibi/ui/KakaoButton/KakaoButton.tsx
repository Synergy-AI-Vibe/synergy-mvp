import type { ButtonHTMLAttributes } from "react";
import styles from "./KakaoButton.module.css";

/** 부품 04 — 카카오 로그인 버튼. 색·문구는 카카오 가이드라인 고정값(변경 금지) */
export function KakaoButton({ className, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={[styles.btn, className].filter(Boolean).join(" ")} {...props}>
      {children ?? "카카오로 계속하기"}
    </button>
  );
}
