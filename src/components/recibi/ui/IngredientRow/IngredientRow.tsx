import { formatWon } from "@/lib/recibi/calc";
import type { RecipeIngredient } from "@/types/recibi";
import { PriceInput } from "@/components/recibi/ui/PriceInput/PriceInput";
import { Tag } from "@/components/recibi/ui/Tag/Tag";

/** 부품 13 — 재료 행. 체크 해제(집에 있음)와 가격 없는 재료 직접 입력을 함께 다룬다 (02_동작규칙 4-1·4-2) */
interface IngredientRowProps {
  ingredient: RecipeIngredient;
  checked: boolean;
  manualPrice: number;
  onToggle: (id: string) => void;
  onManualPriceChange: (id: string, value: number) => void;
}

// 체크박스는 44px 투명 input을 겹쳐 클릭 영역을 확보하고, 보이는 상자는 형제 label 20px
const BOX =
  "inline-flex size-5 flex-none items-center justify-center border border-text-3 bg-surface text-xs leading-none text-on-ink " +
  "peer-hover:border-text peer-checked:border-text peer-checked:bg-text peer-active:border-accent " +
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

export function IngredientRow({
  ingredient,
  checked,
  manualPrice,
  onToggle,
  onManualPriceChange,
}: IngredientRowProps) {
  const subText = checked
    ? [ingredient.amountLabel, ingredient.note].filter(Boolean).join(" · ")
    : "집에 있음 · 계산에서 제외";

  return (
    <li className="flex flex-wrap items-center gap-[14px] border-b border-line py-[15px]">
      <span className="relative inline-flex size-11 flex-none items-center justify-center">
        <input
          id={`ingredient-${ingredient.id}`}
          className="peer absolute inset-0 m-0 size-11 cursor-pointer opacity-0"
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(ingredient.id)}
        />
        <label htmlFor={`ingredient-${ingredient.id}`} className={BOX} aria-hidden="true">
          {checked ? "✓" : ""}
        </label>
      </span>

      <span className="flex min-w-[170px] flex-1 flex-col gap-1">
        <span className="flex items-center gap-[7px]">
          <span
            className={`text-sm font-bold ${checked ? "text-text" : "text-text-2 line-through"}`}
          >
            {ingredient.name}
          </span>
          {ingredient.estimated && checked && <Tag variant="estimate">추정</Tag>}
        </span>
        <span className="text-xs leading-[1.6] text-text-2">{subText}</span>
      </span>

      <span className="flex-none">
        {checked && ingredient.source && <Tag variant="source">{ingredient.source}</Tag>}
        {checked && ingredient.hasNoPriceData && <Tag variant="no-price">금액 없음</Tag>}
      </span>

      <span className="min-w-22 flex-none text-right text-[14.5px] font-bold text-text">
        {ingredient.hasNoPriceData ? (
          checked ? (
            <PriceInput
              id={`ingredient-price-${ingredient.id}`}
              label={`${ingredient.name} 금액 직접 입력`}
              value={manualPrice}
              onChange={(value) => onManualPriceChange(ingredient.id, value)}
            />
          ) : (
            "0원"
          )
        ) : (
          <span className={checked ? undefined : "text-text-2 line-through"}>
            {formatWon(ingredient.cost ?? 0)}
          </span>
        )}
      </span>
    </li>
  );
}
