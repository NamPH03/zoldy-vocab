"use client";

import { useState } from "react";
import { sendPasswordReset } from "@/lib/auth";
import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess(false);
    setLoading(true);

    const result = await sendPasswordReset(email);
    setLoading(false);

    if (result.success) {
      setSuccess(true);
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
            Quên mật khẩu?
          </h1>
          <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
            Nhập email của bạn để nhận link đặt lại mật khẩu
          </p>
        </div>

        {success ? (
          <div className="text-center py-4">
            <div className="w-14 h-14 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: "rgba(34,197,94,0.12)" }}>
              <CheckCircle className="w-7 h-7 text-green-500" />
            </div>
            <p className="text-sm font-bold mb-2" style={{ color: "var(--text)" }}>
              Đã gửi email hướng dẫn!
            </p>
            <p className="text-xs leading-relaxed mb-6" style={{ color: "var(--text-muted)" }}>
              Vui lòng kiểm tra hộp thư <strong>{email}</strong> và nhấn vào link để đặt mật khẩu mới (kiểm tra cả thư mục Spam/Rác nếu cần).
            </p>
            <Link href="/login" className="btn py-3 px-6 rounded-2xl text-xs font-bold text-white shadow-md inline-block" style={{ background: "var(--primary)" }}>
              Quay lại đăng nhập
            </Link>
          </div>
        ) : (
          <>
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

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div>
                <label className="block text-xs font-bold mb-1.5" style={{ color: "var(--text-muted)" }}>
                  Email đã đăng ký
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4"
                    style={{ color: "var(--text-faint)" }} />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="example@gmail.com"
                    required
                    className="input pl-10 text-sm rounded-2xl w-full border"
                    style={{ background: "var(--surface-2)", borderColor: "var(--border-strong)", color: "var(--text)" }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 mt-1 rounded-2xl font-extrabold text-sm text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)" }}
              >
                {loading ? "Đang gửi email..." : "Gửi link đặt lại mật khẩu"}
              </button>
            </form>
          </>
        )}

        <div className="mt-6 text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
            style={{ color: "var(--text-muted)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Quay lại đăng nhập
          </Link>
        </div>
      </div>
    </main>
  );
}
