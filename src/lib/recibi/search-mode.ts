import type { RecipeInputMode } from "@/types/recibi";

/**
 * 주소의 ?mode= 를 입력 모드로 읽는다. 기본값(url)은 주소에 남기지 않는다.
 * 서버 컴포넌트(홈)와 클라이언트 컴포넌트(결과 화면)가 함께 쓰므로 "use client" 밖에 둔다.
 */
export function parseRecipeInputMode(value: string | string[] | undefined): RecipeInputMode {
  return value === "text" ? "text" : "url";
}
