"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useRecibiApp, RECIBI_BOOKMARK_LIMIT } from "@/context/RecibiAppContext";
import { ListRow } from "@/components/recibi/ui/ListRow/ListRow";
import { Banner } from "@/components/recibi/ui/Banner/Banner";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import styles from "./page.module.css";

// b1 목록 · b2 비어있음 · b3 5개 가득 — 전부 이 화면의 상태다.
// 목록에는 가격을 넣지 않는다 — /api/bookmarks가 절대 계산하지 않기 때문 (5건이면 20초+API 쿼터 5배).
// 가격은 행을 열 때(/result)만 계산된다.
export default function BookmarksPage() {
  const router = useRouter();
  const { isLoggedIn, bookmarks, removeBookmark } = useRecibiApp();

  useEffect(() => {
    if (!isLoggedIn) {
      router.replace(`/login?next=${encodeURIComponent("/bookmarks")}`);
    }
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  const isFull = (bookmarks?.length ?? 0) >= RECIBI_BOOKMARK_LIMIT;

  return (
    <main>
      <section className={`container ${styles.section}`}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>북마크</h1>
          <span className={[styles.count, isFull && styles.countFull].filter(Boolean).join(" ")}>
            {bookmarks?.length ?? 0} / {RECIBI_BOOKMARK_LIMIT}개
          </span>
        </div>

        {isFull && (
          <Banner>
            <b>북마크가 가득 찼습니다.</b> 하나를 지우고 다시 저장해주세요.
          </Banner>
        )}

        {bookmarks === null ? (
          <div className={styles.skeletonList} aria-hidden="true">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        ) : bookmarks.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>저장한 레시피가 없습니다</p>
            <p className={styles.emptyDesc}>계산 결과에서 북마크를 누르면 여기에 쌓입니다.</p>
          </div>
        ) : (
          <ul className={styles.list}>
            {bookmarks.map((bookmark) => {
              const canOpen = bookmark.sourceType === "youtube" && Boolean(bookmark.sourceUrl);
              return (
                <ListRow
                  key={bookmark.id}
                  title={bookmark.title}
                  meta={
                    canOpen
                      ? `유튜브 · ${bookmark.servings}인분`
                      : "직접 입력 · 다시 열 수 없음"
                  }
                  onOpen={
                    canOpen ? () => router.push(`/result?url=${encodeURIComponent(bookmark.sourceUrl!)}`) : undefined
                  }
                  onDelete={() => removeBookmark(bookmark.id)}
                />
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
