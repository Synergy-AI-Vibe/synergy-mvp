"use client";

// 로그인 상태는 루트 레이아웃(서버 컴포넌트)이 세션에서 읽어 initialUser로 넘겨준다 — 로그인·
// 로그아웃 둘 다 풀 페이지 리다이렉트라서(§2) 매번 서버가 다시 실행되며 최신 값을 주므로 클라이언트
// 쪽에서 별도로 동기화할 필요가 없다. 북마크는 /api/bookmarks를 그대로 부르는 얇은 캐시일 뿐이다.

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import type { RecipeSearchState, ToastMessage } from "@/types/recibi";

export const RECIBI_BOOKMARK_LIMIT = 5;
const TOAST_DURATION_MS = 2600;
const EMPTY_SEARCH: RecipeSearchState = { url: "", text: "" };

// a1 로그인 · a3 회원탈퇴는 화면 이동 없이 모달로 뜬다. 어느 화면에서든 열 수 있어야 해서
// 열림 상태를 Context에 두고, 실제 모달은 layout에 한 번만 렌더링한다.
export type ModalState = { kind: "login"; fromResult: boolean } | { kind: "withdraw" } | null;

export interface RecibiUser {
  id: string;
  name: string;
}

export interface BookmarkItem {
  id: number;
  title: string;
  sourceType: "youtube" | "manual";
  sourceUrl: string | null;
  servings: number;
  createdAt: string;
}

type AddBookmarkResult =
  | { ok: true; bookmark: BookmarkItem }
  | { ok: false; reason: "unauthorized" | "limit" | "duplicate" | "error"; message: string };

interface AddBookmarkInput {
  title: string;
  sourceType: "youtube" | "manual";
  sourceUrl: string | null;
  servings: number;
}

interface RecibiAppContextValue {
  user: RecibiUser | null;
  isLoggedIn: boolean;
  /** null = 아직 불러오는 중(또는 비로그인) */
  bookmarks: BookmarkItem[] | null;
  addBookmark: (input: AddBookmarkInput) => Promise<AddBookmarkResult>;
  removeBookmark: (id: number) => Promise<boolean>;
  toast: ToastMessage | null;
  showToast: (message: ToastMessage) => void;
  /** 홈에서 넣은 검색 입력. 결과 화면 상단 검색부가 같은 값을 이어서 보여준다 (모드는 ?mode=) */
  search: RecipeSearchState;
  setSearch: (patch: Partial<RecipeSearchState>) => void;
  modal: ModalState;
  openLoginModal: (options?: { fromResult?: boolean }) => void;
  openWithdrawModal: () => void;
  closeModal: () => void;
}

const RecibiAppContext = createContext<RecibiAppContextValue | null>(null);

export function RecibiAppProvider({
  initialUser,
  children,
}: {
  initialUser: RecibiUser | null;
  children: React.ReactNode;
}) {
  const [bookmarks, setBookmarks] = useState<BookmarkItem[] | null>(null);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [search, setSearchState] = useState<RecipeSearchState>(EMPTY_SEARCH);
  const [modal, setModal] = useState<ModalState>(null);

  const setSearch = useCallback((patch: Partial<RecipeSearchState>) => {
    setSearchState((prev) => ({ ...prev, ...patch }));
  }, []);

  const openLoginModal = useCallback((options?: { fromResult?: boolean }) => {
    setModal({ kind: "login", fromResult: options?.fromResult ?? false });
  }, []);

  const openWithdrawModal = useCallback(() => setModal({ kind: "withdraw" }), []);

  const closeModal = useCallback(() => setModal(null), []);

  useEffect(() => {
    if (!initialUser) return; // 초기값이 이미 null이다 — 로그인·로그아웃은 풀 리다이렉트라 다시 마운트된다
    let cancelled = false;
    fetch("/api/bookmarks")
      .then((res) => res.json())
      .then((data: { ok: boolean; items?: BookmarkItem[] }) => {
        if (!cancelled && data.ok && data.items) setBookmarks(data.items);
      })
      .catch(() => {
        // 목록을 못 불러와도 화면은 그대로 둔다 — 북마크 화면에서 다시 시도할 수 있다
      });
    return () => {
      cancelled = true;
    };
  }, [initialUser]);

  const showToast = useCallback((message: ToastMessage) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const addBookmark = useCallback(async (input: AddBookmarkInput): Promise<AddBookmarkResult> => {
    const res = await fetch("/api/bookmarks", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(input),
    });
    const data = await res.json();
    if (data.ok) {
      setBookmarks((prev) => (prev ? [data.bookmark, ...prev] : [data.bookmark]));
      return { ok: true, bookmark: data.bookmark };
    }
    return { ok: false, reason: data.reason ?? "error", message: data.message ?? "" };
  }, []);

  const removeBookmark = useCallback(async (id: number): Promise<boolean> => {
    const res = await fetch(`/api/bookmarks/${id}`, { method: "DELETE" });
    const data = await res.json();
    if (data.ok) {
      setBookmarks((prev) => (prev ? prev.filter((b) => b.id !== id) : prev));
      return true;
    }
    return false;
  }, []);

  const value = useMemo<RecibiAppContextValue>(
    () => ({
      user: initialUser,
      isLoggedIn: initialUser !== null,
      bookmarks,
      addBookmark,
      removeBookmark,
      toast,
      showToast,
      search,
      setSearch,
      modal,
      openLoginModal,
      openWithdrawModal,
      closeModal,
    }),
    [
      initialUser,
      bookmarks,
      addBookmark,
      removeBookmark,
      toast,
      showToast,
      search,
      setSearch,
      modal,
      openLoginModal,
      openWithdrawModal,
      closeModal,
    ]
  );

  return <RecibiAppContext.Provider value={value}>{children}</RecibiAppContext.Provider>;
}

export function useRecibiApp(): RecibiAppContextValue {
  const ctx = useContext(RecibiAppContext);
  if (!ctx) throw new Error("useRecibiApp은 RecibiAppProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}
