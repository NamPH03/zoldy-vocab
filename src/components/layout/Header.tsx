// src/components/layout/Header.tsx
import Link from "next/link";

export default function Header() {
  return (
    <header className="navbar border-b sticky top-0 z-40 backdrop-blur-xl" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center font-extrabold text-sm text-white shadow-sm"
            style={{ background: "linear-gradient(135deg, #38bdf8, #0284c7)" }}>
            ⚡
          </div>
          <span className="font-extrabold text-base tracking-tight" style={{ color: "var(--text)" }}>
            Zoldy<span style={{ color: "var(--primary)" }}>Vocab</span>
          </span>
        </Link>
      </div>
    </header>
  );
}
