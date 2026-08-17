// src/app/page.tsx
"use client";

import Link from "next/link";
import ThemeToggle from "@/components/ui/ThemeToggle";
import { BookOpen, Layers, Repeat, Flame, Sparkles, Award, ArrowRight, Volume2, ShieldCheck } from "lucide-react";

const features = [
  {
    icon: BookOpen,
    label: "Từ vựng Oxford, TOEIC & IELTS",
    desc: "Hệ thống từ vựng chuẩn CEFR A1–C1 kèm phiên âm IPA, giải nghĩa chuẩn xác và câu ví dụ ngữ cảnh sinh động.",
    color: "#0284c7",
    bg: "rgba(2,132,199,0.1)"
  },
  {
    icon: Layers,
    label: "Flashcard Tương tác & Audio",
    desc: "Lật thẻ 3D trực quan, nghe phát âm chuẩn bản xứ (US/UK) chỉ với một chạm, gõ và chọn đáp án tức thì.",
    color: "#38bdf8",
    bg: "rgba(56,189,248,0.1)"
  },
  {
    icon: Repeat,
    label: "Thuật toán Ôn tập Ngắt quãng (SRS)",
    desc: "Spaced Repetition 5 cấp độ tự động tính toán thời điểm vàng trước khi quên để nhắc bạn ôn tập hiệu quả nhất.",
    color: "#0ea5e9",
    bg: "rgba(14,165,233,0.1)"
  },
  {
    icon: Flame,
    label: "Streak & Gamification",
    desc: "Theo dõi chuỗi ngày học liên tục, tích lũy XP, thăng hạng Leaderboard và duy trì động lực bền bỉ mỗi ngày.",
    color: "#f97316",
    bg: "rgba(249,115,22,0.1)"
  },
];

const sampleWords = [
  { word: "resilient", ipa: "/rɪˈzɪl.jənt/", type: "adj", meaning: "Kiên cường, có khả năng phục hồi nhanh", level: "B2" },
  { word: "ubiquitous", ipa: "/juːˈbɪk.wə.təs/", type: "adj", meaning: "Có mặt ở khắp mọi nơi, phổ biến", level: "C1" },
  { word: "collaborate", ipa: "/kəˈlæb.ə.reɪt/", type: "verb", meaning: "Hợp tác, cộng tác làm việc", level: "TOEIC" },
];

export default function HomePage() {
  return (
    <main className="min-h-[100dvh] bg-page relative overflow-x-hidden">

      {/* Ambient glow background */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden -z-0">
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] rounded-full opacity-25 dark:opacity-15 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary-light), transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 -right-40 w-[400px] h-[400px] rounded-full opacity-20 dark:opacity-10 blur-3xl"
          style={{ background: "radial-gradient(circle, var(--primary), transparent 70%)" }}
        />
      </div>

      {/* Navbar */}
      <nav className="sticky top-0 z-50 backdrop-blur-xl border-b"
        style={{ background: "var(--nav-bg)", borderColor: "var(--border-color)" }}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-sm"
              style={{ background: "linear-gradient(135deg, #38bdf8, #0284c7)" }}>
              ⚡
            </div>
            <span className="text-lg font-black tracking-tight" style={{ color: "var(--text)" }}>
              Zoldy<span style={{ color: "var(--primary)" }}>Vocab</span>
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login" className="btn text-sm px-3.5 py-1.5 rounded-xl font-bold transition-all hover:bg-[var(--surface-2)]"
              style={{ color: "var(--text)" }}>
              Đăng nhập
            </Link>
            <Link href="/register" className="btn text-sm px-4 py-1.5 rounded-xl font-bold text-white shadow-sm transition-transform active:scale-95"
              style={{ background: "var(--primary)" }}>
              Bắt đầu ngay
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-4 pt-16 pb-20 gap-6 max-w-4xl mx-auto">

        {/* Eyebrow badge */}
        <div
          className="badge text-xs font-bold uppercase tracking-widest px-3.5 py-1.5 rounded-full flex items-center gap-1.5 animate-fade-in shadow-sm"
          style={{
            background: "var(--primary-glow)",
            color: "var(--primary)",
            border: "1px solid var(--border-strong)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" /> Nền tảng học từ vựng Tiếng Anh thông minh
        </div>

        {/* Headline */}
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight animate-fade-up"
          style={{ color: "var(--text)" }}>
          Chinh phục từ vựng <br />
          <span style={{ color: "var(--primary)" }}>Ghi nhớ vĩnh viễn với Spaced Repetition</span>
        </h1>

        {/* Subtitle */}
        <p className="text-base sm:text-lg max-w-2xl font-medium leading-relaxed animate-fade-up delay-75"
          style={{ color: "var(--text-muted)" }}>
          Luyện từ vựng tiếng Anh theo chuẩn CEFR (A1–C1), TOEIC & IELTS. Học qua flashcard âm thanh IPA, kiểm tra đa dạng và thuật toán ôn tập ngắt quãng khoa học.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 pt-2 w-full sm:w-auto animate-fade-up delay-100">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl font-extrabold text-base text-white shadow-md transition-all duration-200 active:scale-95 hover:shadow-lg"
            style={{ background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
          >
            Bắt đầu học miễn phí <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dictionary"
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl font-bold text-base transition-all duration-200 active:scale-95 border"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-strong)",
              color: "var(--text)",
            }}
          >
            Tra cứu từ điển
          </Link>
        </div>

        {/* Interactive Cards Preview */}
        <div className="w-full max-w-2xl mt-8 grid grid-cols-1 sm:grid-cols-3 gap-3 animate-fade-up delay-150">
          {sampleWords.map((item, index) => (
            <div
              key={index}
              className="card p-4 rounded-2xl border text-left flex flex-col justify-between transition-all hover:scale-[1.02] shadow-sm"
              style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
            >
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-lg font-extrabold" style={{ color: "var(--text)" }}>{item.word}</span>
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full"
                    style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
                    {item.level}
                  </span>
                </div>
                <div className="text-xs font-mono font-medium mb-2" style={{ color: "var(--primary)" }}>
                  {item.ipa}
                </div>
                <div className="text-xs font-medium line-clamp-2" style={{ color: "var(--text-muted)" }}>
                  {item.meaning}
                </div>
              </div>
              <div className="mt-3 pt-2 border-t flex items-center justify-between text-[11px] font-semibold"
                style={{ borderColor: "var(--border-color)", color: "var(--text-faint)" }}>
                <span className="italic">{item.type}</span>
                <span className="flex items-center gap-1 text-[var(--primary)]">
                  <Volume2 className="w-3.5 h-3.5" /> Audio
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature Grid */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 py-16">
        <div className="text-center mb-12 animate-fade-up">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
            Phương pháp học từ vựng hiệu quả tối đa
          </h2>
          <p className="text-sm sm:text-base mt-2 font-medium" style={{ color: "var(--text-muted)" }}>
            Kết hợp khoa học trí nhớ và trải nghiệm số mượt mà
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div
                key={i}
                className="card p-6 rounded-3xl border flex flex-col gap-4 transition-all duration-200 hover:-translate-y-1 hover:shadow-md animate-fade-up"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-color)",
                  animationDelay: `${i * 100}ms`
                }}
              >
                <div
                  className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
                  style={{ background: f.bg, color: f.color }}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base mb-1.5" style={{ color: "var(--text)" }}>
                    {f.label}
                  </h3>
                  <p className="text-xs leading-relaxed font-medium" style={{ color: "var(--text-muted)" }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 border-t py-8 text-center text-xs font-medium"
        style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-extrabold" style={{ color: "var(--text)" }}>ZoldyVocab</span>
            <span>— Nền tảng học từ vựng tiếng Anh</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:underline">Đăng nhập</Link>
            <Link href="/register" className="hover:underline">Đăng ký</Link>
            <Link href="/dictionary" className="hover:underline">Từ điển</Link>
          </div>
        </div>
      </footer>
    </main>
  );
}