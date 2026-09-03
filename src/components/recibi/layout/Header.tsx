"use client";

import Link from "next/link";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { AccountMenu } from "@/components/recibi/ui/AccountMenu/AccountMenu";
import styles from "./Header.module.css";

/** 부품 22 — 헤더. 비로그인이면 북마크 항목과 구분자를 함께 숨긴다 (02_동작규칙 6항 헤더 표시 규칙) */
export function Header() {
  const { isLoggedIn, user, logout, openLoginModal, openWithdrawModal } = useRecibiApp();

  return (
    <header className={styles.header}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.logo}>
          레시비
        </Link>
        <nav className={styles.nav} aria-label="주요 메뉴">
          <span className={styles.navGroup}>
            <Link href="/pantry" className={styles.navItem}>
              있는 재료로 찾기
            </Link>
            <span className={styles.sep} aria-hidden="true" />
          </span>

          {isLoggedIn && (
            <span className={styles.navGroup}>
              <Link href="/bookmarks" className={styles.navItem}>
                북마크
              </Link>
              <span className={styles.sep} aria-hidden="true" />
            </span>
          )}

          {isLoggedIn && user ? (
            <AccountMenu name={user.name} onLogout={logout} onWithdraw={openWithdrawModal} />
          ) : (
            <button type="button" className={styles.navItem} onClick={() => openLoginModal()}>
              로그인
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}
