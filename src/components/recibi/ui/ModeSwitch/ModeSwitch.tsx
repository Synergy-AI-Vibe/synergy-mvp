import styles from "./ModeSwitch.module.css";

/** 부품 09 — 입력 모드 전환 (h1 링크로 계산 ↔ h2 레시피 직접 입력). 02_동작규칙 2-1 */
export type InputMode = "url" | "text";

interface ModeSwitchProps {
  mode: InputMode;
  onChange: (mode: InputMode) => void;
}

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className={styles.wrap} role="tablist" aria-label="레시피 입력 방법">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "url"}
        className={[styles.item, mode === "url" && styles.on].filter(Boolean).join(" ")}
        onClick={() => onChange("url")}
      >
        링크로 계산
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "text"}
        className={[styles.item, mode === "text" && styles.on].filter(Boolean).join(" ")}
        onClick={() => onChange("text")}
      >
        레시피 직접 입력
      </button>
    </div>
  );
}
