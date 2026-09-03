// 브라우저용 Supabase 클라이언트 — 로그인 버튼 등 클라이언트 컴포넌트에서 사용.
// anon(public) 키만 사용한다. service_role 키는 절대 클라이언트에 노출 금지.
import { createBrowserClient } from "@supabase/ssr";

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
