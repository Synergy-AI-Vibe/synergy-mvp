import type { ReactNode } from "react";
import styles from "./Banner.module.css";

/** 부품 16 — 경고 배너. 가격 없는 재료(r2), 북마크 5개 가득(b3) 등 */
export function Banner({ children }: { children: ReactNode }) {
  return (
    <div className={styles.banner} role="status">
      {children}
    </div>
  );
}
