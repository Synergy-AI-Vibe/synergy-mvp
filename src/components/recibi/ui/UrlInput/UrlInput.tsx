import styles from "./UrlInput.module.css";

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

export function UrlInput({
  value,
  onChange,
  onSubmit,
  error,
  showYoutubeTag,
  disabled,
  placeholder,
}: UrlInputProps) {
  return (
    <div className={[styles.wrap, error && styles.err, disabled && styles.disabled].filter(Boolean).join(" ")}>
      {showYoutubeTag && <span className={styles.tag}>YOUTUBE</span>}
      <label className="visually-hidden" htmlFor="recipe-url-input">
        유튜브 영상 링크
      </label>
      <input
        id="recipe-url-input"
        className={styles.input}
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
