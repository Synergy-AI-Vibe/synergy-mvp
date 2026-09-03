import type { ButtonHTMLAttributes } from "react";

/** 부품 04 — 카카오 로그인 버튼. 색·문구는 카카오 가이드라인 고정값(변경 금지) */
const BASE =
  "inline-flex min-h-tap w-full items-center justify-center bg-kakao px-[26px] py-[15px] text-[14.5px] font-bold text-text focus-visible:outline-text enabled:hover:bg-kakao-hover enabled:active:bg-kakao-press disabled:bg-kakao disabled:text-text-3";

export function KakaoButton({
  className,
  children,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button type="button" className={[BASE, className].filter(Boolean).join(" ")} {...props}>
      {children ?? "카카오로 계속하기"}
    </button>
  );
}
