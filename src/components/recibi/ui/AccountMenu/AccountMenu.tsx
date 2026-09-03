"use client";

import { useEffect, useRef, useState } from "react";
import styles from "./AccountMenu.module.css";

/** 부품 18 — 계정 메뉴. Esc·바깥 클릭으로 닫힘 (02_동작규칙 6-2, 바깥 클릭은 문서에 없는 접근성 추가사항) */
interface AccountMenuProps {
  name: string;
  onLogout: () => void;
  onWithdraw: () => void;
}

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
    <div className={styles.wrap} ref={wrapRef}>
      <button
        type="button"
        className={styles.trigger}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((prev) => !prev)}
      >
        {name}
      </button>
      {open && (
        <div className={styles.menu} role="menu">
          <button
            type="button"
            role="menuitem"
            className={styles.item}
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
            className={`${styles.item} ${styles.danger}`}
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
