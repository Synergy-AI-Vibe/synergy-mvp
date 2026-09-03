import styles from "./PriceInput.module.css";

/** 부품 12 — 금액 입력칸. 가격 데이터 없는 재료에 직접 입력 (02_동작규칙 4-2). 빈 값과 0은 같게 다룬다 */
interface PriceInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export function PriceInput({ id, value, onChange, label }: PriceInputProps) {
  return (
    <div className={styles.wrap}>
      <label className="visually-hidden" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={styles.input}
        type="number"
        min={0}
        step={100}
        inputMode="numeric"
        placeholder="0"
        value={value === 0 ? "" : value}
        onChange={(event) => {
          const next = Number(event.target.value);
          onChange(Number.isFinite(next) && next > 0 ? next : 0);
        }}
      />
      <span className={styles.unit}>원</span>
    </div>
  );
}
