import { useState, type KeyboardEvent } from "react";

/** 부품 14 — 칩. 선택됨(×로 제거)과 추천(눌러서 담기) 두 상태 (02_동작규칙 7-1·7-2) */
interface ChipProps {
  label: string;
  selected?: boolean;
  disabled?: boolean;
  /** 눌러서 담는 칩임을 앞의 +로 알린다 (자주 쓰는 재료 줄) */
  addable?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

const BASE = "inline-flex items-center gap-2 border px-3 py-2 text-[13px] font-medium";

export function Chip({ label, selected, disabled, addable, onClick, onRemove }: ChipProps) {
  if (selected) {
    return (
      <span className={`${BASE} group border-text bg-text text-on-ink active:bg-ink-press`}>
        {label}
        <button
          type="button"
          className="font-normal text-chip-mark group-hover:text-on-ink hover:text-on-ink"
          onClick={onRemove}
          aria-label={`${label} 빼기`}
        >
          ×
        </button>
      </span>
    );
  }
  return (
    <button
      type="button"
      className={`${BASE} border-line text-text enabled:hover:border-text enabled:active:bg-canvas disabled:cursor-not-allowed disabled:text-disabled`}
      onClick={onClick}
      disabled={disabled}
    >
      {addable && <span aria-hidden="true">＋</span>}
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
    <span className="inline-flex items-center border border-line-strong py-[7px] pr-2 pl-3">
      <label className="sr-only" htmlFor="pantry-add-input">
        가진 재료 직접 입력
      </label>
      <input
        id="pantry-add-input"
        className="w-40 border-none bg-transparent p-0 text-[13px] font-medium text-text outline-none placeholder:text-text-3"
        type="text"
        maxLength={10}
        placeholder="재료 입력 후 Enter"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
      />
    </span>
  );
}
