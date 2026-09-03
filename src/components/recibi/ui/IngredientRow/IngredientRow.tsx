import { formatWon } from "@/lib/recibi/calc";
import type { RecipeIngredient } from "@/types/recibi";
import { PriceInput } from "@/components/recibi/ui/PriceInput/PriceInput";
import { Tag } from "@/components/recibi/ui/Tag/Tag";
import styles from "./IngredientRow.module.css";

/** 부품 13 — 재료 행. 체크 해제(집에 있음)와 가격 없는 재료 직접 입력을 함께 다룬다 (02_동작규칙 4-1·4-2) */
interface IngredientRowProps {
  ingredient: RecipeIngredient;
  checked: boolean;
  manualPrice: number;
  onToggle: (id: string) => void;
  onManualPriceChange: (id: string, value: number) => void;
}

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
    <li className={styles.row}>
      <span className={styles.checkboxWrap}>
        <input
          id={`ingredient-${ingredient.id}`}
          className={styles.checkbox}
          type="checkbox"
          checked={checked}
          onChange={() => onToggle(ingredient.id)}
        />
        <label htmlFor={`ingredient-${ingredient.id}`} className={styles.box} aria-hidden="true">
          {checked ? "✓" : ""}
        </label>
      </span>

      <span className={styles.info}>
        <span className={styles.nameLine}>
          <span className={[styles.name, !checked && styles.struck].filter(Boolean).join(" ")}>
            {ingredient.name}
          </span>
          {ingredient.estimated && checked && <Tag variant="estimate">추정</Tag>}
        </span>
        <span className={styles.sub}>{subText}</span>
      </span>

      <span className={styles.tagCol}>
        {checked && ingredient.source && <Tag variant="source">{ingredient.source}</Tag>}
        {checked && ingredient.hasNoPriceData && <Tag variant="no-price">금액 없음</Tag>}
      </span>

      <span className={styles.costCol}>
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
          <span className={!checked ? styles.struck : undefined}>{formatWon(ingredient.cost ?? 0)}</span>
        )}
      </span>
    </li>
  );
}
