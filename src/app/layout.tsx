import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { Suspense } from "react";
import { RecibiAppProvider, type RecibiUser } from "@/context/RecibiAppContext";
import { Toast } from "@/components/recibi/ui/Toast/Toast";
import { ToastFromQuery } from "@/components/recibi/ToastFromQuery";
import { Header } from "@/components/recibi/layout/Header";
import { Footer } from "@/components/recibi/layout/Footer";
import { LoginModal } from "@/components/recibi/auth/LoginModal";
import { WithdrawModal } from "@/components/recibi/auth/WithdrawModal";
import { createClient } from "@/lib/supabase/server";
import "./globals.css";

const notoSansKr = Noto_Sans_KR({
  variable: "--font-noto-sans-kr",
  subsets: ["latin"],
  weight: ["400", "500", "700", "900"],
});

export const metadata: Metadata = {
  title: "레시비 — 유튜브 레시피 재료비 계산",
  description: "유튜브 레시피의 재료비를 계산해 사 먹을 때와 비교하는 서비스",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const initialUser: RecibiUser | null = user
    ? {
        id: user.id,
        name:
          (user.user_metadata?.nickname as string | undefined) ??
          (user.user_metadata?.name as string | undefined) ??
          "회원",
      }
    : null;

  return (
    <html lang="ko" className={`${notoSansKr.variable}`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-text tabular-nums antialiased break-keep">
        <RecibiAppProvider initialUser={initialUser}>
          <Suspense fallback={null}>
            <ToastFromQuery />
          </Suspense>
          <Header />
          {children}
          <Footer />
          {/* 로그인·탈퇴는 화면 이동 없이 모달로 뜬다 — 어디서 눌러도 보던 자리를 유지한다 */}
          <Suspense fallback={null}>
            <LoginModal />
          </Suspense>
          <WithdrawModal />
          <Toast />
        </RecibiAppProvider>
      </body>
    </html>
  );
}
