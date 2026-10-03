import type { Metadata, Viewport } from "next";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

export const metadata: Metadata = {
  title: "Doruk Alp Çamaşırhane — Takip Sistemi",
  description: "Doruk Alp Çamaşırhane günlük ve aylık takip sistemi",
  applicationName: "Doruk Alp Çamaşırhane",
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/doruk-alp-icon.svg",
    shortcut: "/doruk-alp-icon.svg",
    apple: "/doruk-alp-icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#071A33",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400..700&display=swap"
          rel="stylesheet"
        />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Doruk Alp" />
        <script
          dangerouslySetInnerHTML={{
            __html: `try{var t=localStorage.getItem("theme");if(t==="dark")document.documentElement.classList.add("dark")}catch(e){}`,
          }}
        />
      </head>
      <body className="min-h-screen font-sans antialiased">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
