"use client";

import { useSyncExternalStore } from "react";

function subscribeNever() {
  return () => {};
}

/**
 * 클라이언트에서만 확정되는 값(세션 스토리지, 로그인 세션 등)으로 리다이렉트를 결정하기 전에
 * 이 값이 true인지 먼저 확인해야 한다. 서버 스냅샷(false)으로 첫 렌더가 끝나고 그 다음 렌더에서야
 * 실제 값이 반영되는데, 그 사이에 리다이렉트를 판단하면 아직 동기화 전 값을 보고 잘못 튕겨낸다.
 * useSyncExternalStore는 하이드레이션 뒤 getSnapshot과 getServerSnapshot이 다르면 한 번 더
 * 리렌더하는 게 보장돼 있어, 별도 setState 없이 이 재렌더만으로 true가 된다.
 */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    subscribeNever,
    () => true,
    () => false
  );
}
