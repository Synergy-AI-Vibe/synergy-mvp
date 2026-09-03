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
    <main className="shrink-0 grow basis-auto">
      <section className="container pt-[clamp(34px,5vw,52px)] pb-[clamp(48px,7vw,80px)]">
        <div className="mb-1 flex flex-wrap items-baseline justify-between gap-4">
          <h1 className="text-[clamp(21px,2.6vw,26px)] leading-[1.3] font-black tracking-[-0.035em]">
            북마크
          </h1>
          <span className={`text-[12.5px] ${isFull ? "text-accent" : "text-text-2"}`}>
            {bookmarks.length} / {RECIBI_BOOKMARK_LIMIT}개
          </span>
        </div>
        <p className="mb-[22px] text-[13px] leading-[1.7] text-text-2">
          저장한 레시피는 열 때마다 그날 가격으로 다시 계산합니다.
          <br />
          {RECIBI_BOOKMARK_LIMIT}개까지 저장할 수 있습니다.
        </p>

        {isFull && (
          <Banner>
            북마크가 {RECIBI_BOOKMARK_LIMIT}개로 가득 찼습니다. 새로 저장하려면 아래에서 먼저 지워
            주세요.
          </Banner>
        )}

        {live === null ? (
          <div className="flex flex-col gap-3" aria-hidden="true">
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
            <Skeleton height={64} />
          </div>
        ) : live.length === 0 ? (
          <div className="py-10 text-center">
            <p className="mb-1.5 text-[14.5px] font-bold">저장한 레시피가 없습니다</p>
            <p className="text-[13px] text-text-2">계산 결과에서 북마크를 누르면 여기에 쌓입니다.</p>
          </div>
        ) : (
          <>
            <ul className="border-t border-line-strong">
              {live.map((bookmark) => (
                <ListRow
                  key={bookmark.id}
                  title={bookmark.title}
                  meta={`${bookmark.sourceLabel} · ${bookmark.servings}인분`}
                  trailing={
                    <span className="text-right">
                      <span className="text-[14.5px] font-bold text-text">{formatWon(bookmark.cost)}</span>
                      <br />
                      <span className="text-xs text-text-2">1인분 {formatWon(bookmark.perServing)}</span>
                    </span>
                  }
                  onOpen={() => router.push(`/result/${bookmark.recipeId}`)}
                  onDelete={() => removeBookmark(bookmark.id)}
                />
              ))}
            </ul>
            <p className="mt-[18px] max-w-[58ch] text-[12.5px] leading-[1.75] text-text-2">
              금액은 그 레시피의 재료비 원가입니다.
              <br />
              가격이 바뀌면 여는 순간 다시 계산됩니다.
            </p>
          </>
        )}
      </section>
    </main>
  );
}
