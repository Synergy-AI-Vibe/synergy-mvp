"use client";

import { useEffect, useRef, useState } from "react";

/** 부품 18 — 계정 메뉴. Esc·바깥 클릭으로 닫힘 (02_동작규칙 6-2, 바깥 클릭은 문서에 없는 접근성 추가사항) */
interface AccountMenuProps {
  name: string;
  onLogout: () => void;
  onWithdraw: () => void;
}

const ITEM =
  "flex min-h-tap w-full items-center border-b border-line px-4 py-[13px] text-left text-[13px] font-medium last:border-b-0 hover:bg-canvas focus-visible:outline-offset-[-2px] active:bg-line";

export function AccountMenu({ name, onLogout, onWithdraw }: AccountMenuProps) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!wrapRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div className="relative" ref={wrapRef}>
      <button
        type="button"
        className="min-h-tap px-0.5 text-[13px] font-bold text-text"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {name}
      </button>
      {open && (
        <div
          className="absolute top-[26px] right-0 z-10 min-w-[148px] border border-line-strong bg-surface"
          role="menu"
        >
          <button
            type="button"
            role="menuitem"
            className={`${ITEM} text-text`}
            onClick={() => {
              setOpen(false);
              onLogout();
            }}
          >
            로그아웃
          </button>
          <button
            type="button"
            role="menuitem"
            className={`${ITEM} text-accent`}
            onClick={() => {
              setOpen(false);
              onWithdraw();
            }}
          >
            회원탈퇴
          </button>
        </div>
      )}
    </div>
  );
}
