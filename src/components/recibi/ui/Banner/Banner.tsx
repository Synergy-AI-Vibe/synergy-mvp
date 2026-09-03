import type { ReactNode } from "react";

/** 부품 16 — 경고 배너. 가격 없는 재료(r2), 북마크 5개 가득(b3) 등 */
export function Banner({ children }: { children: ReactNode }) {
  return (
    <div
      className="mb-5 border border-accent bg-accent-soft px-4 py-[14px] text-[12.5px] leading-[1.75] text-text [&_b]:font-bold"
      role="status"
    >
      {children}
    </div>
  );
}
