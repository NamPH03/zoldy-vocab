"use client";

import { useEffect, useState } from "react";

export default function SplashScreen() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [isDark, setIsDark] = useState(true); // default dark để tránh flash

  useEffect(() => {
    // Đọc theme chính xác từ document.documentElement (đã set từ script head) hoặc localStorage
    try {
      const isDocDark = document.documentElement.classList.contains("dark");
      const savedTheme = localStorage.getItem("theme");
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const darkMode = isDocDark || savedTheme === "dark" || (!savedTheme && prefersDark);
      setIsDark(darkMode);
    } catch {
      setIsDark(true);
    }

    // Chỉ hiển thị splash màn hình khi mở app lần đầu trong phiên
    const hasSeenSplash = sessionStorage.getItem("has_seen_splash");
    if (hasSeenSplash) {
      setVisible(false);
      return;
    }

    let isAppReady = (window as unknown as { __APP_READY__?: boolean }).__APP_READY__ || false;
    let minTimePassed = false;

    const tryDismiss = () => {
      if (isAppReady && minTimePassed) {
        setFadeOut(true);
        setTimeout(() => {
          setVisible(false);
          sessionStorage.setItem("has_seen_splash", "true");
        }, 500);
      }
    };

    // 1. Thời gian hiển thị tối thiểu (1.2s)
    const minTimer = setTimeout(() => {
      minTimePassed = true;
      tryDismiss();
    }, 1200);

    // 2. Timeout an toàn tối đa 4s
    const maxTimer = setTimeout(() => {
      isAppReady = true;
      minTimePassed = true;
      tryDismiss();
    }, 4000);

    // 3. Lắng nghe sự kiện "app-ready" khi Dashboard tải xong
    const handleReady = () => {
      isAppReady = true;
      tryDismiss();
    };

    window.addEventListener("app-ready", handleReady);

    return () => {
      clearTimeout(minTimer);
      clearTimeout(maxTimer);
      window.removeEventListener("app-ready", handleReady);
    };
  }, []);

  if (!visible) return null;

  const bgColor = isDark ? "#08101e" : "#f0f9ff";
  const textColor = isDark ? "#f0f9ff" : "#082f49";
  const subColor = isDark ? "#94a3b8" : "#0369a1";

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center transition-opacity duration-500 ease-out select-none ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      style={{ background: bgColor }}
    >
      {/* Logo & App Icon với hiệu ứng Glow */}
      <div className="flex flex-col items-center gap-4 animate-scale-in">
        <div
          className="relative w-24 h-24 rounded-3xl p-[2px] flex items-center justify-center shadow-lg"
          style={{ 
            boxShadow: "0 0 50px rgba(56,189,248,0.45)",
            background: "linear-gradient(135deg, #38bdf8, #0284c7)"
          }}
        >
          <span className="text-4xl font-extrabold text-white tracking-wider">⚡Z</span>
        </div>

        <div className="flex flex-col items-center text-center">
          <h1
            className="text-2xl font-extrabold tracking-tight"
            style={{ color: textColor }}
          >
            ZoldyVocab
          </h1>
          <p
            className="text-xs font-semibold tracking-widest uppercase mt-1"
            style={{ color: subColor }}
          >
            Master English Vocabulary
          </p>
        </div>
      </div>
    </div>
  );
}
