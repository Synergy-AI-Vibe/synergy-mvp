"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useRecibiApp, useHasMounted, RECIBI_BOOKMARK_LIMIT } from "@/context/RecibiAppContext";
import { recalcBookmarks } from "@/lib/services/recibi/bookmark-service";
import { formatWon } from "@/lib/recibi/calc";
import { ListRow } from "@/components/recibi/ui/ListRow/ListRow";
import { Banner } from "@/components/recibi/ui/Banner/Banner";
import { Skeleton } from "@/components/recibi/ui/Skeleton/Skeleton";
import type { BookmarkWithLivePrice } from "@/types/recibi";
import styles from "./page.module.css";

// b1 목록 · b2 비어있음 · b3 5개 가득 — 전부 이 화면의 상태다 (bookmarks.length로 구분)
export default function BookmarksPage() {
  const router = useRouter();
  const { isLoggedIn, bookmarks, removeBookmark, openLoginModal } = useRecibiApp();
  const hasMounted = useHasMounted();
  const [live, setLive] = useState<BookmarkWithLivePrice[] | null>(null);

  useEffect(() => {
    // 로그인 전용 화면이라 홈으로 돌려보내고, 로그인 모달을 그 위에 띄운다
    if (hasMounted && !isLoggedIn) {
      router.replace("/");
      openLoginModal();
    }
  }, [hasMounted, isLoggedIn, router, openLoginModal]);

  useEffect(() => {
    let cancelled = false;
    recalcBookmarks(bookmarks).then((result) => {
      if (!cancelled) setLive(result);
    });
    return () => {
      cancelled = true;
    };
  }, [bookmarks]);

  if (!isLoggedIn) return null;

  const isFull = bookmarks.length >= RECIBI_BOOKMARK_LIMIT;

  return (
    <main>
      <section className={`container ${styles.section}`}>
        <div className={styles.titleRow}>
          <h1 className={styles.title}>북마크</h1>
          <span className={[styles.count, isFull && styles.countFull].filter(Boolean).join(" ")}>
            {bookmarks.length} / {RECIBI_BOOKMARK_LIMIT}개
          </span>
        </div>

        {isFull && (
          <Banner>
            <b>북마크가 가득 찼습니다.</b> 하나를 지우고 다시 저장해주세요.
          </Banner>
        )}

        {live === null ? (
          <div className={styles.skeletonList} aria-hidden="true">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        ) : live.length === 0 ? (
          <div className={styles.empty}>
            <p className={styles.emptyTitle}>저장한 레시피가 없습니다</p>
            <p className={styles.emptyDesc}>계산 결과에서 북마크를 누르면 여기에 쌓입니다.</p>
          </div>
        ) : (
          <>
            <ul className={styles.list}>
              {live.map((bookmark) => (
                <ListRow
                  key={bookmark.id}
                  title={bookmark.title}
                  meta={`${bookmark.sourceLabel} · ${bookmark.servings}인분`}
                  trailing={
                    <span className={styles.priceBlock}>
                      <span className={styles.cost}>{formatWon(bookmark.cost)}</span>
                      <br />
                      <span className={styles.perServing}>1인분 {formatWon(bookmark.perServing)}</span>
                    </span>
                  }
                  onOpen={() => router.push(`/result/${bookmark.recipeId}`)}
                  onDelete={() => removeBookmark(bookmark.id)}
                />
              ))}
            </ul>
            <p className={styles.caption}>여는 시점의 가격으로 다시 계산한 값입니다.</p>
          </>
        )}
      </section>
    </main>
  );
}
