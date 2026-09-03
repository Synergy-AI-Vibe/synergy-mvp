"use client";

// 로그인 상태 · 토스트 · 북마크(최대 5개)를 담는 전역 Context.
// 02_동작규칙 1-5 "북마크만 저장됩니다" — 그래서 이 세 가지만 localStorage에 남기고,
// 재료 체크·탭 선택 등 나머지 화면 상태는 각 페이지의 로컬 state로만 존재한다.
//
// user·bookmarks는 useSyncExternalStore로 localStorage와 동기화한다. 마운트 후 effect에서
// setState하는 방식은 서버 렌더(빈 값)와 클라이언트 첫 렌더가 어긋나는 걸 막기 위해 쓰는데,
// useSyncExternalStore가 getServerSnapshot으로 그 문제를 표준적으로 해결해준다.

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { loginWithKakao, logout as logoutService, withdrawAccount } from "@/lib/services/recibi/auth-service";
import type { Bookmark, Recipe, ToastMessage, User } from "@/types/recibi";

const USER_STORAGE_KEY = "recibi:user";
const BOOKMARKS_STORAGE_KEY = "recibi:bookmarks";
const TOAST_DURATION_MS = 2600;
const BOOKMARK_LIMIT = 5;

type AddBookmarkResult = "saved" | "full" | "unauthenticated";

interface RecibiAppContextValue {
  user: User | null;
  isLoggedIn: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  withdraw: () => Promise<void>;
  bookmarks: Bookmark[];
  isBookmarked: (recipeId: string) => boolean;
  addBookmark: (recipe: Recipe) => AddBookmarkResult;
  removeBookmark: (id: string) => void;
  toast: ToastMessage | null;
  showToast: (message: ToastMessage) => void;
}

const RecibiAppContext = createContext<RecibiAppContextValue | null>(null);

/** localStorage 하나를 useSyncExternalStore로 구독 가능하게 감싼 작은 저장소 */
function createLocalStore<T>(key: string, fallback: T) {
  let cached = fallback;
  let hydrated = false;
  const listeners = new Set<() => void>();

  function hydrate() {
    if (hydrated || typeof window === "undefined") return;
    hydrated = true;
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) cached = JSON.parse(raw) as T;
    } catch {
      // 저장된 값을 읽지 못하면 fallback을 그대로 쓴다
    }
  }

  return {
    get(): T {
      hydrate();
      return cached;
    },
    getServerSnapshot(): T {
      return fallback;
    },
    set(value: T) {
      cached = value;
      hydrated = true;
      if (typeof window !== "undefined") {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch {
          // 저장 실패는 무시 — 목업 단계라 별도 처리하지 않는다
        }
      }
      listeners.forEach((listener) => listener());
    },
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const userStore = createLocalStore<User | null>(USER_STORAGE_KEY, null);
const bookmarksStore = createLocalStore<Bookmark[]>(BOOKMARKS_STORAGE_KEY, []);

export function RecibiAppProvider({ children }: { children: React.ReactNode }) {
  const user = useSyncExternalStore(userStore.subscribe, userStore.get, userStore.getServerSnapshot);
  const bookmarks = useSyncExternalStore(bookmarksStore.subscribe, bookmarksStore.get, bookmarksStore.getServerSnapshot);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: ToastMessage) => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = setTimeout(() => setToast(null), TOAST_DURATION_MS);
  }, []);

  const login = useCallback(async () => {
    const nextUser = await loginWithKakao();
    userStore.set(nextUser);
    showToast("카카오 계정으로 로그인했습니다.");
  }, [showToast]);

  const logout = useCallback(async () => {
    await logoutService();
    userStore.set(null);
    showToast("로그아웃되었습니다.");
  }, [showToast]);

  const withdraw = useCallback(async () => {
    await withdrawAccount();
    userStore.set(null);
    bookmarksStore.set([]);
    showToast("탈퇴가 완료되었습니다.");
  }, [showToast]);

  const isBookmarked = useCallback(
    (recipeId: string) => bookmarks.some((b) => b.recipeId === recipeId),
    [bookmarks]
  );

  const addBookmark = useCallback(
    (recipe: Recipe): AddBookmarkResult => {
      if (!user) return "unauthenticated";
      if (bookmarks.some((b) => b.recipeId === recipe.id)) return "saved";
      if (bookmarks.length >= BOOKMARK_LIMIT) return "full";
      bookmarksStore.set([
        ...bookmarks,
        {
          id: `${recipe.id}-${Date.now()}`,
          recipeId: recipe.id,
          title: recipe.title,
          sourceLabel: recipe.sourceLabel,
          servings: recipe.servings,
          savedAt: new Date().toISOString(),
        },
      ]);
      return "saved";
    },
    [bookmarks, user]
  );

  const removeBookmark = useCallback(
    (id: string) => {
      bookmarksStore.set(bookmarks.filter((b) => b.id !== id));
    },
    [bookmarks]
  );

  const value = useMemo<RecibiAppContextValue>(
    () => ({
      user,
      isLoggedIn: user !== null,
      login,
      logout,
      withdraw,
      bookmarks,
      isBookmarked,
      addBookmark,
      removeBookmark,
      toast,
      showToast,
    }),
    [user, login, logout, withdraw, bookmarks, isBookmarked, addBookmark, removeBookmark, toast, showToast]
  );

  return <RecibiAppContext.Provider value={value}>{children}</RecibiAppContext.Provider>;
}

export function useRecibiApp(): RecibiAppContextValue {
  const ctx = useContext(RecibiAppContext);
  if (!ctx) throw new Error("useRecibiApp은 RecibiAppProvider 안에서만 쓸 수 있습니다.");
  return ctx;
}

export const RECIBI_BOOKMARK_LIMIT = BOOKMARK_LIMIT;

function subscribeNever() {
  return () => {};
}

/**
 * 로그인 여부로 페이지를 리다이렉트하기 전에 이 값을 먼저 확인해야 한다.
 * user·bookmarks는 localStorage 기반이라 서버 스냅샷(false/null)으로 첫 렌더가 끝나고
 * 그 다음 렌더에서야 실제 값으로 바뀐다 — useHasMounted가 false인 동안 리다이렉트를
 * 판단하면, 실제로는 로그인 상태인데도 동기화되기 전 값(false)을 보고 잘못 쫓아낸다.
 * useSyncExternalStore는 하이드레이션 뒤 getSnapshot과 getServerSnapshot이 다르면
 * 한 번 더 리렌더하는 게 보장되어 있어, 별도 setState 없이 이 재렌더만으로 true가 된다.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}
