// TODO: 카카오 OAuth 연동 전까지 사용하는 목업 서비스.
// 02_동작규칙 6-1 "카카오 하나뿐" — 실제 인증창 없이 즉시 로그인 상태를 돌려준다.

import type { User } from "@/types/recibi";

const AUTH_DELAY_MS = 500;

function wait(ms: number) {
  return new Promise<void>((resolve) => setTimeout(resolve, ms));
}

export async function loginWithKakao(): Promise<User> {
  await wait(AUTH_DELAY_MS);
  return { name: "김자취" };
}

export async function logout(): Promise<void> {
  await wait(200);
}

export async function withdrawAccount(): Promise<void> {
  await wait(500);
}
