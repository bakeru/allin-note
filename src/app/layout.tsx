import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AllIn Note",
  description: "AIが書いてくれる、教室のカルテと連絡ノート。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
