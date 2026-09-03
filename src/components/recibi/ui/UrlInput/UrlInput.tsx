/** 부품 10 — URL 입력창. YOUTUBE 라벨은 값이 있고, 오류가 아니고, 형식을 통과할 때만 보인다 (02_동작규칙 2-2) */
interface UrlInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  error?: boolean;
  showYoutubeTag?: boolean;
  disabled?: boolean;
  placeholder?: string;
}

const WRAP =
  "flex flex-wrap items-stretch gap-2 border py-1.5 pr-1.5 pl-4 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus";

export function UrlInput({
  value,
  onChange,
  onSubmit,
  error,
  showYoutubeTag,
  disabled,
  placeholder,
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
      {showYoutubeTag && (
        <span className="self-center text-[11px] font-medium tracking-[0.06em] whitespace-nowrap text-text-2">
          YOUTUBE
        </span>
      )}
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
    </div>
  );
}
