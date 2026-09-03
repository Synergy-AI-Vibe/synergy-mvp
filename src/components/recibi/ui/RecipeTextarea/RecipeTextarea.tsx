import type { ReactNode, TextareaHTMLAttributes } from "react";

/** 부품 11 — 텍스트 영역. h2(직접 입력), h4(실패 복구), r4(원문 보기)에서 쓴다 */
interface RecipeTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  quiet?: boolean;
  footNote?: string;
  /** 하단 바 오른쪽에 붙는 실행 버튼 — 입력과 계산이 한 덩어리로 보여야 한다 */
  action?: ReactNode;
  /** 카드 안에 들어갈 때처럼 낮게 쓰는 변형 */
  compact?: boolean;
}

const WRAP =
  "border p-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus";

export function RecipeTextarea({ quiet, footNote, action, compact, className, ...props }: RecipeTextareaProps) {
  const wrapClass = [WRAP, quiet ? "border-line" : "border-line-strong", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapClass}>
      <textarea
        className={`block w-full border-none bg-transparent px-3 pt-3 pb-2 leading-[1.9] whitespace-pre-line text-text outline-none placeholder:text-text-3 ${
          compact ? "min-h-20 text-[13.5px]" : "min-h-26 text-sm"
        }`}
        {...props}
      />
      {(footNote || action) && (
        <div className="flex flex-wrap items-center justify-between gap-3 px-1.5 pt-1.5 pb-1">
          <span className="text-xs leading-[1.7] text-text-2">{footNote}</span>
          {action}
        </div>
      )}
    </div>
  );
}
