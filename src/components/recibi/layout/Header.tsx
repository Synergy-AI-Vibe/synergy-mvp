"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useRecibiApp } from "@/context/RecibiAppContext";
import { AccountMenu } from "@/components/recibi/ui/AccountMenu/AccountMenu";
import styles from "./Header.module.css";

/** 부품 22 — 헤더. 비로그인이면 북마크 항목과 구분자를 함께 숨긴다 (6항 헤더 표시 규칙) */
export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { isLoggedIn, user } = useRecibiApp();
  const next = encodeURIComponent(pathname || "/");

  function handleLogout() {
    // /auth/signout은 POST만 받는다(링크 프리페치로 실수 로그아웃 방지) — 실제 <form> 제출로 부른다.
    const form = document.createElement("form");
    form.method = "post";
    form.action = "/auth/signout";
    document.body.appendChild(form);
    form.submit();
  }

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
            <AccountMenu
              name={user.name}
              onLogout={handleLogout}
              onWithdraw={() => router.push(`/withdraw?next=${next}`)}
            />
          ) : (
            <Link href={`/login?next=${next}`} className={styles.navItem}>
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
