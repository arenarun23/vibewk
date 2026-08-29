import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "달력 가계부",
  description: "수입·지출을 등록하고 달력에서 한눈에 확인하는 가계부",
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
