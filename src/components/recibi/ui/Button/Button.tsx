import type { ButtonHTMLAttributes } from "react";
import styles from "./Button.module.css";

/** 부품 01·02 — 주 버튼(검정/빨강) */
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "black" | "accent";
  size?: "md" | "sm";
  fullWidth?: boolean;
}

export function Button({
  variant = "black",
  size = "md",
  fullWidth,
  className,
  ...props
}: ButtonProps) {
  const classes = [
    styles.btn,
    variant === "accent" && styles.accent,
    size === "sm" && styles.sm,
    fullWidth && styles.full,
    className,
  ]
    .filter(Boolean)
    .join(" ");
  return <button type="button" className={classes} {...props} />;
}
