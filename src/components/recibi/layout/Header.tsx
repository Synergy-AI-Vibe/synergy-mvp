"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { AccountMenu } from "@/components/recibi/ui/AccountMenu/AccountMenu";

/** 부품 22 — 헤더. 비로그인이면 북마크 항목과 구분자를 함께 숨긴다 (02_동작규칙 6항 헤더 표시 규칙) */

// ::before로 보이는 크기는 그대로 두고 클릭 영역만 넓힌다 (11_디자인시스템 3-4항)
const NAV_ITEM =
  "relative text-[13px] before:absolute before:-inset-y-[13px] before:-inset-x-1.5 before:content-[''] hover:text-text active:text-accent";
const NAV_ON = "font-bold text-text";
const NAV_OFF = "font-medium text-text-2";
const SEP = "h-3.5 w-px bg-line-2";

export function Header() {
  const pathname = usePathname();
  const { isLoggedIn, user, openLoginModal, openWithdrawModal } = useRecibiApp();
  const navClass = (href: string) => `${NAV_ITEM} ${pathname === href ? NAV_ON : NAV_OFF}`;

  function handleLogout() {
    // /auth/signout은 POST만 받는다(링크 프리페치로 실수 로그아웃 방지) — 실제 <form> 제출로 부른다.
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/auth/signout";
    document.body.appendChild(form);
    form.submit();
  }

  return (
    <header className="border-b border-line">
      <div className="container flex flex-wrap items-center justify-between gap-4 py-5">
        <Link href="/" className="text-[17px] font-black tracking-[-0.03em]">
          레시비
        </Link>
        <nav className="flex flex-wrap items-center gap-[18px]" aria-label="주요 메뉴">
          <span className="flex items-center gap-[18px]">
            <Link href="/pantry" className={navClass("/pantry")}>
              있는 재료로 찾기
            </Link>
            <span className={SEP} aria-hidden="true" />
          </span>

          {isLoggedIn && (
            <span className="flex items-center gap-[18px]">
              <Link href="/bookmarks" className={navClass("/bookmarks")}>
                북마크
              </Link>
              <span className={SEP} aria-hidden="true" />
            </span>
          )}

          {isLoggedIn && user ? (
            <AccountMenu name={user.name} onLogout={handleLogout} onWithdraw={openWithdrawModal} />
          ) : (
            <button type="button" className={`${NAV_ITEM} ${NAV_ON}`} onClick={() => openLoginModal()}>
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
