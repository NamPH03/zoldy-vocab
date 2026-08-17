"use client";

import { useState } from "react";
import { login } from "@/lib/auth";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import GoogleSignInButton from "@/components/ui/GoogleSignInButton";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(email, password);
    setLoading(false);

    if (result.success) {
      window.location.href = "/dashboard";
    } else {
      setError(result.error);
    }
  };

  return (
    <main className="min-h-[100dvh] bg-page flex items-center justify-center px-4 relative overflow-hidden">

      <div className="pointer-events-none fixed inset-0 -z-0">
        <div className="absolute -top-20 left-1/2 -translate-x-1/2 w-[500px] h-[400px] rounded-full blur-3xl opacity-20"
          style={{ background: "radial-gradient(circle, var(--primary-light), transparent 70%)" }} />
      </div>

      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle />
      </div>

      <div className="w-full max-w-[420px] card p-8 animate-scale-in relative z-10 rounded-3xl border shadow-xl"
        style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>

        <div className="text-center mb-6">
          <Link href="/" className="inline-flex items-center gap-2.5 mb-4 group transition-transform active:scale-95">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-sm transition-transform group-hover:scale-105"
              style={{ background: "linear-gradient(135deg, #38bdf8, #0284c7)" }}>
              ⚡
            </div>
            <span className="text-xl font-black tracking-tight" style={{ color: "var(--text)" }}>
              Zoldy<span style={{ color: "var(--primary)" }}>Vocab</span>
            </span>
          </Link>
          <h1 className="text-2xl font-extrabold mb-1" style={{ color: "var(--text)" }}>
            Chào mừng trở lại! 👋
          </h1>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Tiếp tục chinh phục từ vựng tiếng Anh mỗi ngày
          </p>
        </div>

        {error && (
          <div className="mb-4 px-4 py-3 rounded-2xl text-xs font-semibold leading-relaxed"
            style={{
              background: "rgba(239,68,68,0.1)",
              color: "#ef4444",
              border: "1px solid rgba(239,68,68,0.2)",
            }}>
            {error}
          </div>
        )}

        {/* Đăng nhập Google */}
        <GoogleSignInButton onError={setError} />

        <div className="flex items-center gap-3 my-5">
          <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
          <span className="text-xs font-medium" style={{ color: "var(--text-faint)" }}>hoặc với email</span>
          <div className="flex-1 h-px" style={{ background: "var(--border-color)" }} />
        </div>

        <form onSubmit={handleLogin} className="flex flex-col gap-4">
          <div>
            <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@gmail.com"
              required
              className="input text-sm rounded-2xl w-full border"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-strong)", color: "var(--text)" }}
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-bold" style={{ color: "var(--text-muted)" }}>
                Mật khẩu
              </label>
              <Link
                href="/forgot-password"
                className="text-xs font-semibold hover:underline"
                style={{ color: "var(--primary)" }}
              >
                Quên mật khẩu?
              </Link>
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Nhập mật khẩu"
              required
              className="input text-sm rounded-2xl w-full border"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-strong)", color: "var(--text)" }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 mt-1 rounded-2xl font-extrabold text-sm text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)" }}
          >
            {loading ? (
              <span className="flex items-center gap-2 justify-center">
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Đang đăng nhập...
              </span>
            ) : "Đăng nhập"}
          </button>
        </form>

        <p className="text-center text-xs font-medium mt-6" style={{ color: "var(--text-muted)" }}>
          Chưa có tài khoản?{" "}
          <Link href="/register" className="font-bold hover:underline" style={{ color: "var(--primary)" }}>
            Đăng ký miễn phí
          </Link>
        </p>
      </div>
    </main>
  );
}
