import { formatWon } from "@/lib/calc";
import type { IngredientRow as ApiIngredientRow } from "@/types/api";
import { PriceInput } from "@/components/recibi/ui/PriceInput/PriceInput";
import { Tag } from "@/components/recibi/ui/Tag/Tag";

/** 부품 13 — 재료 행. 체크 해제(집에 있음)와 가격 없는 재료 직접 입력을 함께 다룬다 (5-1·5-2) */
interface IngredientRowProps {
  ingredient: ApiIngredientRow;
  onToggle: (id: number) => void;
  onManualPriceChange: (id: number, value: number) => void;
}

// 체크박스는 44px 투명 input을 겹쳐 클릭 영역을 확보하고, 보이는 상자는 형제 label 20px
const BOX =
  "inline-flex size-5 flex-none items-center justify-center border-[1.5px] border-text-3 bg-surface text-xs leading-none text-transparent " +
  "peer-hover:border-text peer-checked:border-text peer-checked:bg-text peer-checked:text-on-ink peer-active:border-accent " +
  "peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-focus";

/** 시안 r2 — 이름 옆에는 분량만, 서브 줄에는 "무엇을 얼마에 사서 얼마만큼 쓰는지" */
function amountText(ingredient: ApiIngredientRow): string | null {
  if (ingredient.amount !== null && ingredient.amountUnit) {
    return `${ingredient.amount}${ingredient.amountUnit}`;
  }
  if (ingredient.qty !== null && ingredient.unit) return `${ingredient.qty}${ingredient.unit}`;
  return null;
}

function subText(ingredient: ApiIngredientRow): string {
  if (!ingredient.checked) return "집에 있음 · 계산에서 제외";
  if (!ingredient.hasPrice) return "공공 데이터에 없습니다 · 금액을 넣어 주세요";
  return [ingredient.packLabel, ingredient.conversionNote].filter(Boolean).join(" · ");
}

export function IngredientRow({ ingredient, onToggle, onManualPriceChange }: IngredientRowProps) {
  const checked = ingredient.checked;
  const displayName = ingredient.name ?? ingredient.rawText;
  const amount = amountText(ingredient);

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
        <b className={`block text-sm leading-[1.4] font-bold ${checked ? "text-text" : "text-text-2"}`}>
          {displayName}
          {amount && <i className="font-normal text-text-2 not-italic"> {amount}</i>}
        </b>
        <span className="block text-xs leading-[1.5] text-text-2">{subText(ingredient)}</span>
      </span>

      <span className="flex flex-none items-center gap-2.5">
        {checked && ingredient.priceConfidence === "estimate" && <Tag variant="estimate">추정</Tag>}
        {checked && ingredient.needsConfirm && <Tag variant="confirm">확인 필요</Tag>}
        {checked && !ingredient.hasPrice && <Tag variant="no-price">금액 없음</Tag>}

        {!ingredient.hasPrice ? (
          checked ? (
            <PriceInput
              id={`ingredient-price-${ingredient.id}`}
              label={`${displayName} 금액 직접 입력`}
              value={ingredient.userPrice ?? 0}
              onChange={(value) => onManualPriceChange(ingredient.id, value)}
            />
          ) : (
            <span className="text-[14.5px] font-bold text-text-2 line-through">0원</span>
          )
        ) : (
          // 해제된 행도 금액은 남기고 취소선만 긋는다 — 얼마가 빠졌는지 보여야 한다 (시안 r3)
          <span
            className={`text-[14.5px] font-bold ${checked ? "text-text" : "text-text-2 line-through"}`}
          >
            {formatWon(ingredient.unitCost ?? 0)}원
          </span>
        )}
      </span>
    </li>
  );
}
