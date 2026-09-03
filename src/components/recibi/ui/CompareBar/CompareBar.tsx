import { formatWon } from "@/lib/calc";
import styles from "./CompareBar.module.css";

/** 부품 20 — 비교 막대. "사 먹으면" 항상 100%, "해먹으면"은 채움 비율만큼 (02_동작규칙 3-2) */
interface CompareBarProps {
  eatOutAvg: number;
  ingredientTotal: number;
  fillPercent: number;
}

export function CompareBar({ eatOutAvg, ingredientTotal, fillPercent }: CompareBarProps) {
  return (
    <div className={styles.bars}>
      <div className={styles.bar}>
        <span className={styles.label}>사 먹으면</span>
        <span className={styles.track}>
          <span className={styles.fill} style={{ width: "100%" }} />
        </span>
        <span className={styles.value}>{formatWon(eatOutAvg)}원</span>
      </div>
      <div className={styles.bar}>
        <span className={styles.label}>해먹으면</span>
        <span className={styles.track}>
          <span className={`${styles.fill} ${styles.fillAccent}`} style={{ width: `${fillPercent}%` }} />
        </span>
        <span className={`${styles.value} ${styles.valueAccent}`}>{formatWon(ingredientTotal)}원</span>
      </div>
    </div>
  );
}
