import type { ReactNode } from "react";

/** 부품 10 — URL 입력창.
 * action은 테두리 안 오른쪽에 붙는 실행 버튼 — 입력과 계산이 한 덩어리로 보여야 한다. */
interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: boolean;
  disabled?: boolean;
  placeholder?: string;
  action?: ReactNode;
  /** 넘기면 값이 있을 때 테두리 안에 지우기(×) 버튼이 생긴다 */
  onClear?: () => void;
}

const WRAP =
  "flex flex-wrap items-stretch gap-2 border py-1.5 pr-1.5 pl-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus";

export function UrlInput({
  value,
  onChange,
  onSubmit,
  error,
  disabled,
  placeholder,
  action,
  onClear,
}: UrlInputProps) {
  const wrapClass = [
    WRAP,
    error ? "border-accent" : disabled ? "border-line" : "border-line-strong",
    disabled && "bg-canvas",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className={wrapClass}>
      <label className="sr-only" htmlFor="recipe-url-input">
        유튜브 영상 링크
      </label>
      <input
        id="recipe-url-input"
        className="min-h-8 min-w-30 flex-1 self-center border-none bg-transparent py-3 text-[14.5px] text-text outline-none placeholder:text-text-3"
        type="text"
        inputMode="url"
        autoComplete="off"
        value={value}
        placeholder={placeholder ?? "유튜브 링크를 붙여넣으세요"}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            onSubmit();
          }
        }}
        aria-invalid={error || undefined}
      />
      {onClear && value.length > 0 && (
        <button
          type="button"
          className="flex flex-none items-center self-center px-2 text-[15px] text-text-2 hover:text-accent"
          onClick={onClear}
          aria-label="입력한 링크 지우기"
        >
          ×
        </button>
      )}
      {action && <span className="flex flex-none items-stretch">{action}</span>}
    </div>
  );
}
