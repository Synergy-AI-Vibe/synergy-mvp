import type { CSSProperties } from "react";
import styles from "./Skeleton.module.css";

/** 로딩 표현 — 스켈레톤만 쓴다. 스피너·진행 막대 금지, 깜빡임 없음 (11_디자인시스템 4-1항) */
export function Skeleton({ height = 16, style }: { height?: number; style?: CSSProperties }) {
  return <div className={styles.block} style={{ height, ...style }} aria-hidden="true" />;
}
