import type { ButtonHTMLAttributes } from "react";

/** 부품 01·02 — 주 버튼(검정/빨강) */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "black" | "accent";
  size?: "md" | "sm";
  fullWidth?: boolean;
}

// 세로 패딩은 시안 13px → 44px 클릭영역 확보를 위해 15px (11_디자인시스템 3-4항)
const BASE =
  "inline-flex min-h-tap items-center justify-center gap-1.5 px-[26px] py-[15px] font-bold leading-none whitespace-nowrap text-on-ink disabled:bg-canvas disabled:text-text-3";

const VARIANT: Record<"black" | "accent", string> = {
  black: "bg-text enabled:hover:bg-ink-hover enabled:active:bg-ink-press",
  // 빨강 면 위에서는 검정 테두리로 초점을 표시한다
  accent:
    "bg-accent enabled:hover:bg-accent-hover enabled:active:bg-accent-press focus-visible:outline-text",
};

export function Button({
  variant = "black",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    BASE,
    VARIANT[variant],
    size === "sm" ? "text-[13.5px]" : "text-sm",
    fullWidth && "w-full",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button type="button" className={classes} {...props} />;
}
