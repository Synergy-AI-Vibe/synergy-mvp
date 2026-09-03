import type { ButtonHTMLAttributes } from "react";

/** 부품 03 — 보조 버튼 */
interface ButtonGhostProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  quiet?: boolean;
  size?: "md" | "sm";
}

const BASE =
  "inline-flex min-h-tap items-center justify-center gap-1.5 border border-line bg-surface px-[26px] py-[15px] font-medium whitespace-nowrap enabled:hover:border-text enabled:active:bg-canvas disabled:border-line disabled:text-disabled";

export function ButtonGhost({ quiet, size = "md", className, ...props }: ButtonGhostProps) {
  const classes = [
    BASE,
    quiet ? "text-text-2" : "text-text",
    size === "sm" ? "text-[13.5px]" : "text-sm",
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button type="button" className={classes} {...props} />;
}
