"use client";

import Link from "next/link";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { AccountMenu } from "@/components/recibi/ui/AccountMenu/AccountMenu";

/** 부품 22 — 헤더. 비로그인이면 북마크 항목과 구분자를 함께 숨긴다 (02_동작규칙 6항 헤더 표시 규칙) */

// ::before로 보이는 크기는 그대로 두고 클릭 영역만 넓힌다 (11_디자인시스템 3-4항)
const NAV_ITEM =
  "relative text-[13px] font-medium text-text-2 before:absolute before:-inset-y-[13px] before:-inset-x-1.5 before:content-[''] hover:text-text active:text-accent";
const SEP = "h-3.5 w-px bg-line-2";

export function Header() {
  const { isLoggedIn, user, logout, openLoginModal, openWithdrawModal } = useRecibiApp();

  return (
    <header className="border-b border-line">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-5">
        <Link href="/" className="text-[17px] font-black tracking-[-0.03em]">
          레시비
        </Link>
        <nav className="flex flex-wrap items-center gap-[18px]" aria-label="주요 메뉴">
          <span className="flex items-center gap-[18px]">
            <Link href="/pantry" className={NAV_ITEM}>
              있는 재료로 찾기
            </Link>
            <span className={SEP} aria-hidden="true" />
          </span>

          {isLoggedIn && (
            <span className="flex items-center gap-[18px]">
              <Link href="/bookmarks" className={NAV_ITEM}>
                북마크
              </Link>
              <span className={SEP} aria-hidden="true" />
            </span>
          )}

          {isLoggedIn && user ? (
            <AccountMenu name={user.name} onLogout={logout} onWithdraw={openWithdrawModal} />
          ) : (
            <button type="button" className={NAV_ITEM} onClick={() => openLoginModal()}>
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
