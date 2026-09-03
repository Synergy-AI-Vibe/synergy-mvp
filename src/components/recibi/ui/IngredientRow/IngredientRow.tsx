import { formatWon } from "@/lib/calc";
import type { IngredientRow as ApiIngredientRow } from "@/types/api";
import { PriceInput } from "@/components/recibi/ui/PriceInput/PriceInput";
import { Tag } from "@/components/recibi/ui/Tag/Tag";
import styles from "./IngredientRow.module.css";

/** 부품 13 — 재료 행. 체크 해제(집에 있음)와 가격 없는 재료 직접 입력을 함께 다룬다 (5-1·5-2) */
interface IngredientRowProps {
  ingredient: ApiIngredientRow;
  onToggle: (id: number) => void;
  onManualPriceChange: (id: number, value: number) => void;
}

export function IngredientRow({ ingredient, onToggle, onManualPriceChange }: IngredientRowProps) {
  const checked = ingredient.checked;
  const displayName = ingredient.name ?? ingredient.rawText;

  const amountText =
    ingredient.amount !== null && ingredient.amountUnit
      ? `${ingredient.amount}${ingredient.amountUnit}`
      : ingredient.qty !== null && ingredient.unit
        ? `${ingredient.qty}${ingredient.unit}`
        : null;

  const subText = checked
    ? [amountText, ingredient.conversionNote, ingredient.packLabel].filter(Boolean).join(" · ")
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
            {displayName}
          </span>
          {checked && ingredient.priceConfidence === "estimate" && <Tag variant="estimate">추정</Tag>}
          {checked && ingredient.needsConfirm && <Tag variant="confirm">확인 필요</Tag>}
        </span>
        <span className={styles.sub}>{subText}</span>
      </span>

      <span className={styles.tagCol}>
        {checked && !ingredient.hasPrice && <Tag variant="no-price">금액 없음</Tag>}
      </span>

      <span className={styles.costCol}>
        {!ingredient.hasPrice ? (
          checked ? (
            <PriceInput
              id={`ingredient-price-${ingredient.id}`}
              label={`${displayName} 금액 직접 입력`}
              value={ingredient.userPrice ?? 0}
              onChange={(value) => onManualPriceChange(ingredient.id, value)}
            />
          ) : (
            "0원"
          )
        ) : (
          <span className={!checked ? styles.struck : undefined}>
            {formatWon(ingredient.unitCost ?? 0)}원
          </span>
        )}
      </span>
    </li>
  );
}
