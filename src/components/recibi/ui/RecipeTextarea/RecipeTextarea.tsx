import type { TextareaHTMLAttributes } from "react";

/** 부품 11 — 텍스트 영역. h2(직접 입력), h4(실패 복구), r4(원문 보기)에서 쓴다 */
interface RecipeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  quiet?: boolean;
  footNote?: string;
}

const WRAP =
  "border p-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus";

export function RecipeTextarea({ quiet, footNote, className, ...props }: RecipeTextareaProps) {
  const wrapClass = [WRAP, quiet ? "border-line" : "border-line-strong", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapClass}>
      <textarea
        className="block min-h-26 w-full border-none bg-transparent px-3 pt-3 pb-2 text-sm leading-[1.9] whitespace-pre-line text-text outline-none placeholder:text-text-3"
        {...props}
      />
      {footNote && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1.5 pt-1.5 pb-1 [&_span]:text-xs [&_span]:text-text-2">
          <span>{footNote}</span>
        </div>
      )}
    </div>
  );
}
