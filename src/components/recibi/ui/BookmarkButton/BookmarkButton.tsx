import type { ButtonHTMLAttributes } from "react";
import styles from "./BookmarkButton.module.css";

/** 부품 05 — 북마크 버튼. active면 "북마크 됨"으로 검정 채움 (02_동작규칙 5-1) */
interface BookmarkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

export function BookmarkButton({ active, className, ...props }: BookmarkButtonProps) {
  const classes = [styles.btn, active && styles.on, className].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} aria-pressed={active} {...props}>
      {active ? "북마크 됨" : "북마크"}
    </button>
  );
}
