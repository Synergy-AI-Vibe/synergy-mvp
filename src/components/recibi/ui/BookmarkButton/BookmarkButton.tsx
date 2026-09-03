import type { ButtonHTMLAttributes } from "react";

/** 부품 05 — 북마크 버튼. active면 "북마크 됨"으로 검정 채움 (02_동작규칙 5-1) */
interface BookmarkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
}

const BASE =
  "inline-flex min-h-tap items-center justify-center gap-1.5 border px-[18px] py-[15px] text-[13px] font-medium whitespace-nowrap";
const OFF =
  "border-line bg-surface text-text enabled:hover:border-text enabled:active:bg-canvas";
const ON =
  "border-text bg-text text-on-ink enabled:hover:border-ink-hover enabled:hover:bg-ink-hover enabled:active:border-ink-press enabled:active:bg-ink-press";

export function BookmarkButton({ active, className, ...props }: BookmarkButtonProps) {
  const classes = [BASE, active ? ON : OFF, className].filter(Boolean).join(" ");
  return (
    <button type="button" className={classes} aria-pressed={active} {...props}>
      {active ? "북마크 됨" : "북마크"}
    </button>
  );
}
