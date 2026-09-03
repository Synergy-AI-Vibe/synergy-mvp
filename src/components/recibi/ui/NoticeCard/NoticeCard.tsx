import type { ReactNode } from "react";
import styles from "./NoticeCard.module.css";

/** 부품 21 — 안내 카드. 추출 실패(h4), 재료로 찾기 결과 없음(p3) 등 원인·복구가 한 카드 안에 있다 */
interface NoticeCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function NoticeCard({ eyebrow, title, description, children }: NoticeCardProps) {
  return (
    <div className={styles.card}>
      <p className={styles.eyebrow}>{eyebrow}</p>
      <h4 className={styles.title}>{title}</h4>
      <p className={styles.desc}>{description}</p>
      {children && <div className={styles.extra}>{children}</div>}
    </div>
  );
}
