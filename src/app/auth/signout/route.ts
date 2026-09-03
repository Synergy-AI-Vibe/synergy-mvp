// 로그아웃 — POST로 호출하면 세션 쿠키를 지우고 로그인 페이지로 돌려보낸다.
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  return NextResponse.redirect(new URL("/login", request.url), { status: 302 });
}
