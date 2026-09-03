import type { ReactNode } from "react";

/** 부품 15 — 태그. 출처(참가격/KAMIS/오픈마켓), 상태(지금 바로 가능/부족 N개), 추정, 금액 없음, 확인 필요 */
type TagVariant = "source" | "ready" | "missing" | "estimate" | "no-price" | "confirm";

interface TagProps {
  variant?: TagVariant;
  children: ReactNode;
}

const BASE = "inline-flex items-center text-[11px] leading-[1.3]";

const VARIANT: Record<TagVariant, string> = {
  source: "bg-canvas px-2 py-1 font-medium text-text-2",
  ready: "bg-text px-2 py-[3px] font-medium text-on-ink",
  missing: "bg-canvas px-2 py-[3px] font-medium text-text-2",
  estimate: "font-normal text-text-2",
  "no-price": "bg-accent-soft px-2 py-1 font-medium text-accent-strong",
  confirm: "font-medium text-accent",
};

export function Tag({ variant = "source", children }: TagProps) {
  return <span className={`${BASE} ${VARIANT[variant]}`}>{children}</span>;
}
