// 서버용 Supabase 클라이언트 — 서버 컴포넌트·Route Handler에서 세션(쿠키)을 읽고 쓸 때 사용.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // 서버 컴포넌트에서 호출되면 쿠키 쓰기가 불가 — 미들웨어/Route Handler에서 갱신되므로 무시
          }
        },
      },
    },
  );
}
