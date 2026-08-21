import type { Metadata } from "next";
import "pretendard/dist/web/variable/pretendardvariable.css";
import { AuthProvider } from "@/components/AuthProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "생기부 도우미",
  description: "교사를 위한 교과 평어 작성 업무 도구",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body><AuthProvider>{children}</AuthProvider></body>
    </html>
  );
}
