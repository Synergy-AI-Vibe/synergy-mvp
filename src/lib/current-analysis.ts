"use client";

// /api/analyze는 상태 없는(stateless) 엔드포인트라 "레시피 id" 개념이 없다. 그래서 결과를
// 라우팅이 아니라 이 세션 스토리지 기반 스토어로 화면 사이에 넘긴다 — 홈에서 계산, 북마크에서
// 다시 열기, 있는 재료로 찾기(SUB)에서 결과 열기가 전부 여기 채워놓고 /result로 이동한다.

import { useSyncExternalStore } from "react";
import type { AnalyzeData } from "@/types/api";

const STORAGE_KEY = "recibi:current-analysis";

let cached: AnalyzeData | null = null;
let hydrated = false;
const listeners = new Set<() => void>();

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (raw) cached = JSON.parse(raw) as AnalyzeData;
  } catch {
    // 저장된 값을 읽지 못하면 비워둔다
  }
}

export function setCurrentAnalysis(data: AnalyzeData) {
  cached = data;
  hydrated = true;
  if (typeof window !== "undefined") {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // 저장 실패는 무시
    }
  }
  listeners.forEach((listener) => listener());
}

function get(): AnalyzeData | null {
  hydrate();
  return cached;
}

function getServerSnapshot(): AnalyzeData | null {
  return null;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useCurrentAnalysis(): AnalyzeData | null {
  return useSyncExternalStore(subscribe, get, getServerSnapshot);
}
