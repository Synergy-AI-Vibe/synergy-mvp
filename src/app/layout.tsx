import type { Metadata } from "next";
import { Noto_Sans_KR } from "next/font/google";
import { RecibiAppProvider } from "@/context/RecibiAppContext";
import { Toast } from "@/components/recibi/ui/Toast/Toast";
import { Header } from "@/components/recibi/layout/Header";
import { Footer } from "@/components/recibi/layout/Footer";
import { LoginModal } from "@/components/recibi/auth/LoginModal";
import { WithdrawModal } from "@/components/recibi/auth/WithdrawModal";
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

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`${notoSansKr.variable}`}>
      <body className="flex min-h-full flex-col bg-surface font-sans text-text tabular-nums antialiased break-keep">
        <RecibiAppProvider>
          <Header />
          {children}
          <Footer />
          <LoginModal />
          <WithdrawModal />
          <Toast />
        </RecibiAppProvider>
      </body>
    </html>
  );
}
