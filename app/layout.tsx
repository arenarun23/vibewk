import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeDeploy Hub",
  description: "코드를 가져오면 GitHub 저장소 생성·push·배포까지 자동으로 진행합니다.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased">
        {children}
      </body>
    </html>
  );
}
