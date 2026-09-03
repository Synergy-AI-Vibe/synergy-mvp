import type { RecipeInputMode } from "@/types/recibi";

/** 부품 09 — 입력 모드 전환 (h1 링크로 계산 ↔ h2 레시피 직접 입력). 02_동작규칙 2-1 */
interface ModeSwitchProps {
  mode: RecipeInputMode;
  onChange: (mode: RecipeInputMode) => void;
}

const ITEM =
  "relative border-b-2 pb-[7px] text-[13.5px] before:absolute before:-inset-x-2 before:-top-[15px] before:-bottom-[15px] before:content-[''] hover:text-text";
const ON = "border-text font-bold text-text";
const OFF = "border-transparent font-medium text-text-2";

export function ModeSwitch({ mode, onChange }: ModeSwitchProps) {
  return (
    <div className="mb-[14px] flex gap-[22px]" role="tablist" aria-label="레시피 입력 방법">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "url"}
        className={`${ITEM} ${mode === "url" ? ON : OFF}`}
        onClick={() => onChange("url")}
      >
        YouTube 링크
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "text"}
        className={`${ITEM} ${mode === "text" ? ON : OFF}`}
        onClick={() => onChange("text")}
      >
        레시피 직접 입력
      </button>
    </div>
  );
}
