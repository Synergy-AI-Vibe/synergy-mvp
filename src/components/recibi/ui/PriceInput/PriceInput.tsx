/** 부품 12 — 금액 입력칸. 가격 데이터 없는 재료에 직접 입력 (02_동작규칙 4-2). 빈 값과 0은 같게 다룬다 */
interface PriceInputProps {
  id: string;
  value: number;
  onChange: (value: number) => void;
  label: string;
}

export function PriceInput({ id, value, onChange, label }: PriceInputProps) {
  return (
    <div className="inline-flex min-h-tap items-center gap-1.5 border border-line-strong px-2.5 py-1.5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus">
      <label className="sr-only" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className="w-22 border-none bg-transparent text-right text-[14.5px] font-bold text-text outline-none placeholder:font-normal placeholder:text-text-3"
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
      <span className="text-[13px] text-text-2">원</span>
    </div>
  );
}
