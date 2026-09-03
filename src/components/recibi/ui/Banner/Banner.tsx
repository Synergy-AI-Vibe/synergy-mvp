import type { ReactNode } from "react";

/** 부품 16 — 경고 배너. 가격 없는 재료(r2), 북마크 5개 가득(b3) 등 */
export function Banner({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-[22px] flex flex-wrap items-baseline gap-2 bg-accent-soft px-[17px] py-[13px] text-[13.5px] text-accent-strong [&_b]:font-bold"
      role="status"
    >
      {children}
    </div>
  );
}
