import type { Metadata } from "next";
import SplashScreen from "@/components/ui/SplashScreen";
import "./globals.css";

export const metadata: Metadata = {
  title: "ZoldyVocab — Master English Vocabulary",
  description: "Học từ vựng tiếng Anh thông minh với Spaced Repetition, phiên âm chuẩn IPA, bộ từ vựng Oxford 3000, TOEIC & IELTS.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        {/* Synchronize theme and status bar color before paint to prevent splash screen mismatch */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');var d=window.matchMedia('(prefers-color-scheme: dark)').matches;var isDark=t==='dark'||((!t)&&d);var c=isDark?'#08101e':'#f0f9ff';if(isDark){document.documentElement.classList.add('dark');}else{document.documentElement.classList.remove('dark');}var m=document.getElementById('theme-color-meta');if(m){m.setAttribute('content',c);}}catch(e){}})()`,
          }}
        />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="theme-color" content="#f0f9ff" id="theme-color-meta" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="ZoldyVocab" />
        <link rel="apple-touch-icon" href="/icon-512.png" />
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className="min-h-screen bg-page text-tx antialiased">
        <SplashScreen />
        <div id="app-scroll">{children}</div>
      </body>
    </html>
  );
}
