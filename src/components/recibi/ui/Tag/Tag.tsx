import type { ReactNode } from "react";
import styles from "./Tag.module.css";

/** 부품 15 — 태그. 출처(참가격/KAMIS/오픈마켓), 상태(지금 바로 가능/부족 N개), 추정, 금액 없음 */
type TagVariant = "source" | "ready" | "missing" | "estimate" | "no-price";

interface TagProps {
  variant?: TagVariant;
  children: ReactNode;
}

const VARIANT_CLASS: Record<TagVariant, string | undefined> = {
  source: undefined,
  ready: styles.ready,
  missing: styles.missing,
  estimate: styles.estimate,
  "no-price": styles.noPrice,
};

export function Tag({ variant = "source", children }: TagProps) {
  return <span className={[styles.tag, VARIANT_CLASS[variant]].filter(Boolean).join(" ")}>{children}</span>;
}
