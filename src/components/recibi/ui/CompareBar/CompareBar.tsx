import { formatWon } from "@/lib/recibi/calc";

/** 부품 20 — 비교 막대. "사 먹으면" 항상 100%, "해먹으면"은 채움 비율만큼 (02_동작규칙 3-2) */
interface CompareBarProps {
  eatOutAvg: number;
  ingredientTotal: number;
  fillPercent: number;
}

const BAR = "flex flex-wrap items-center gap-4 border-b border-line py-4";
const LABEL = "w-24 flex-none text-[13px] leading-[1.4] font-bold";
const TRACK = "flex h-3.5 min-w-30 flex-1 bg-canvas";
const VALUE = "w-24 flex-none text-right text-[15px] font-bold";

export function CompareBar({ eatOutAvg, ingredientTotal, fillPercent }: CompareBarProps) {
  return (
    <div className="border-t border-line-strong">
      <div className={BAR}>
        <span className={LABEL}>사 먹으면</span>
        <span className={TRACK}>
          <span className="block h-full bg-text" style={{ width: "100%" }} />
        </span>
        <span className={VALUE}>{formatWon(eatOutAvg)}</span>
      </div>
      <div className={BAR}>
        <span className={LABEL}>해 먹으면</span>
        <span className={TRACK}>
          <span className="block h-full bg-accent" style={{ width: `${fillPercent}%` }} />
        </span>
        <span className={`${VALUE} text-accent`}>{formatWon(ingredientTotal)}</span>
      </div>
    </div>
  );
}
