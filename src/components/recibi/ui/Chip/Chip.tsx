import { useState, type KeyboardEvent } from "react";
import styles from "./Chip.module.css";

/** 부품 14 — 칩. 선택됨(×로 제거)과 추천(눌러서 담기) 두 상태 (02_동작규칙 7-1·7-2) */
interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export function Chip({ label, selected, disabled, onClick, onRemove }: ChipProps) {
  if (selected) {
    return (
      <span className={[styles.chip, styles.selected].join(" ")}>
        {label}
        <button
          type="button"
          className={styles.mark}
          onClick={onRemove}
          aria-label={`${label} 빼기`}
        >
          ×
        </button>
      </span>
    );
  }
  return (
    <button type="button" className={styles.chip} onClick={onClick} disabled={disabled}>
      {label}
    </button>
  );
}

/** ChipAdd — 직접 입력으로 재료를 추가 (10자까지, Enter로 추가) */
interface ChipAddInputProps {
  onAdd: (value: string) => void;
  disabled?: boolean;
}

export function ChipAddInput({ onAdd, disabled }: ChipAddInputProps) {
  const [value, setValue] = useState("");

  function submit() {
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Enter") {
      event.preventDefault();
      submit();
    }
  }

  if (disabled) return null;

  return (
    <span className={styles.addForm}>
      <label className="visually-hidden" htmlFor="pantry-add-input">
        가진 재료 직접 입력
      </label>
      <input
        id="pantry-add-input"
        className={styles.addInput}
        type="text"
        maxLength={10}
        placeholder="직접 입력"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </span>
  );
}
