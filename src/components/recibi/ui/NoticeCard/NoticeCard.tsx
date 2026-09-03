import type { ReactNode } from "react";

/** 부품 21 — 안내 카드. 추출 실패(h4), 재료로 찾기 결과 없음(p3) 등 원인·복구가 한 카드 안에 있다 */
interface NoticeCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

export function NoticeCard({ eyebrow, title, description, children }: NoticeCardProps) {
  return (
    <div className="border border-line-strong p-8">
      <p className="mb-3 text-xs font-bold tracking-[0.06em] text-accent">{eyebrow}</p>
      <h4 className="mb-2 text-xl leading-[1.4] font-black tracking-[-0.03em]">{title}</h4>
      <p className="mb-[22px] max-w-[56ch] text-[13.5px] leading-[1.8] whitespace-pre-line text-text-2">
        {description}
      </p>
      {children && <div className="mt-[22px]">{children}</div>}
    </div>
  );
}
