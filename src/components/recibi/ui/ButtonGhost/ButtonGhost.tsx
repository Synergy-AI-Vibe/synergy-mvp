import type { ButtonHTMLAttributes } from "react";
import styles from "./ButtonGhost.module.css";

/** 부품 03 — 보조 버튼 */
interface ButtonGhostProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  quiet?: boolean;
  size?: "md" | "sm";
}

export function ButtonGhost({ quiet, size = "md", className, ...props }: ButtonGhostProps) {
  const classes = [styles.btn, quiet && styles.quiet, size === "sm" && styles.sm, className]
    .filter(Boolean)
    .join(" ");
  return <button type="button" className={classes} {...props} />;
}
