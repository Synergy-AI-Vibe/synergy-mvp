import type { ReactNode } from "react";
import styles from "./ListRow.module.css";

/** 부품 17 — 목록 행. b1(북마크)·p2(재료로 찾기 결과)에서 쓴다.
 * 열기(button)와 삭제(button)를 형제 요소로 둬 클릭 영역이 겹치지 않게 한다 (02_동작규칙 5-3) */
interface ListRowProps {
  title: string;
  meta: string;
  trailing?: ReactNode;
  onOpen: () => void;
  onDelete?: () => void;
}

export function ListRow({ title, meta, trailing, onOpen, onDelete }: ListRowProps) {
  return (
    <li className={styles.row}>
      <button type="button" className={styles.open} onClick={onOpen}>
        <span className={styles.main}>
          <span className={styles.title}>{title}</span>
          <span className={styles.meta}>{meta}</span>
        </span>
        {trailing && <span className={styles.trailing}>{trailing}</span>}
      </button>
      {onDelete && (
        <button type="button" className={styles.delete} onClick={onDelete} aria-label={`${title} 삭제`}>
          ×
        </button>
      )}
    </li>
  );
}
