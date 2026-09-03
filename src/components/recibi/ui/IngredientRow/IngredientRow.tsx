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
  "inline-flex size-5 flex-none items-center justify-center border-[1.5px] border-text-3 bg-surface text-xs leading-none text-transparent " +
  "peer-hover:border-text peer-checked:border-text peer-checked:bg-text peer-checked:text-on-ink peer-active:border-accent " +
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

/** 서브 줄은 "무엇을 얼마에 사서 얼마만큼 쓰는지" — 구매 단위 · 단가 · 환산 근거 순 */
function buildSubText(ingredient: RecipeIngredient, checked: boolean): string {
  if (!checked) return "집에 있음 · 계산에서 제외";
  if (ingredient.hasNoPriceData) return "공공 데이터에 없습니다 · 금액을 넣어 주세요";
  return [ingredient.unitLabel, formatWon(ingredient.unitPrice ?? 0), ingredient.note]
    .filter(Boolean)
    .join(" · ");
}

export function IngredientRow({
  ingredient,
  checked,
  manualPrice,
  onToggle,
  onManualPriceChange,
}: IngredientRowProps) {
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
          ✓
        </label>
      </span>

      <span className="min-w-[170px] flex-1">
        {/* 분량은 이름 옆에 붙되 무게를 낮춘다 — 읽는 순서가 "무엇 / 얼마나"가 되도록 */}
        <b
          className={`block text-sm leading-[1.4] font-bold ${checked ? "text-text" : "text-text-2"}`}
        >
          {ingredient.name} <i className="font-normal text-text-2 not-italic">{ingredient.amountLabel}</i>
        </b>
        <span className="block text-xs leading-[1.5] text-text-2">
          {buildSubText(ingredient, checked)}
        </span>
      </span>

      <span className="flex flex-none items-center gap-2.5">
        {checked && ingredient.hasNoPriceData && <Tag variant="no-price">금액 없음</Tag>}
        {checked && !ingredient.hasNoPriceData && ingredient.source && (
          <Tag variant="source">{ingredient.source}</Tag>
        )}

        {ingredient.hasNoPriceData && checked ? (
          <PriceInput
            id={`ingredient-price-${ingredient.id}`}
            label={`${ingredient.name} 금액 직접 입력`}
            value={manualPrice}
            onChange={(value) => onManualPriceChange(ingredient.id, value)}
          />
        ) : (
          // 해제된 행도 금액은 남기고 취소선만 긋는다 — 얼마가 빠졌는지 보여야 한다 (시안 r3)
          <span
            className={`text-[14.5px] font-bold ${
              checked ? "text-text" : "text-text-2 line-through"
            }`}
          >
            {formatWon(ingredient.hasNoPriceData ? 0 : (ingredient.cost ?? 0))}
          </span>
        )}
      </span>
    </li>
  );
}
