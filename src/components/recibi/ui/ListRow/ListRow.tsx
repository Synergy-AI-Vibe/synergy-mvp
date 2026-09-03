import type { ReactNode } from "react";

/** 부품 17 — 목록 행. b1(북마크)·p2(재료로 찾기 결과)에서 쓴다.
 * 열기(button)와 삭제(button)를 형제 요소로 둬 클릭 영역이 겹치지 않게 한다 (02_동작규칙 5-3) */
interface ListRowProps {
  title: string;
  /** 제목 바로 옆에 붙는 상태 태그 */
  titleTag?: ReactNode;
  meta: string;
  trailing?: ReactNode;
  onOpen: () => void;
  onDelete?: () => void;
}

export function ListRow({ title, titleTag, meta, trailing, onOpen, onDelete }: ListRowProps) {
  return (
    <li className="flex items-center gap-2 border-b border-line">
      <button
        type="button"
        className="flex min-w-0 flex-1 flex-wrap items-center gap-4 py-4 text-left hover:bg-canvas focus-visible:outline-offset-[-2px] active:bg-line"
        onClick={onOpen}
      >
        <span className="flex min-w-[170px] flex-1 flex-col gap-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-[14.5px] font-bold text-text">{title}</span>
            {titleTag}
          </span>
          <span className="text-[12.5px] text-text-2">{meta}</span>
        </span>
        {trailing && <span className="flex flex-wrap items-center gap-[14px]">{trailing}</span>}
      </button>
      {onDelete && (
        // 보이는 크기 30px 유지 + 클릭 영역만 44px (11_디자인시스템 3-4항)
        <button
          type="button"
          className="relative inline-flex size-[30px] flex-none items-center justify-center border border-line text-[15px] text-text-2 before:absolute before:-inset-[7px] before:content-[''] hover:border-accent hover:text-accent"
          onClick={onDelete}
          aria-label={`${title} 삭제`}
        >
          ×
        </button>
      )}
    </li>
  );
}
