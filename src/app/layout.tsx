import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Çamaşırhane Takip",
  description: "Günlük ve aylık çamaşırhane takip sistemi",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <body className="min-h-screen font-sans antialiased">{children}</body>
    </html>
  );
}
