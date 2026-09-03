import type { TextareaHTMLAttributes } from "react";
import styles from "./RecipeTextarea.module.css";

/** 부품 11 — 텍스트 영역. h2(직접 입력), h4(실패 복구), r4(원문 보기)에서 쓴다 */
interface RecipeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  quiet?: boolean;
  footNote?: string;
}

export function RecipeTextarea({ quiet, footNote, className, ...props }: RecipeTextareaProps) {
  return (
    <div className={[styles.wrap, quiet && styles.quiet, className].filter(Boolean).join(" ")}>
      <textarea className={styles.textarea} {...props} />
      {footNote && (
        <div className={styles.bar}>
          <span>{footNote}</span>
        </div>
      )}
    </div>
  );
}
