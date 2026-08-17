// src/app/(dashboard)/dictionary/page.tsx
"use client";

import { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { useRouter } from "next/navigation";
import SearchBar from "@/components/dictionary/SearchBar";
import WordDetail from "@/components/dictionary/WordDetail";
import VocabularyList from "@/components/dictionary/VocabularyList";
import { useDictionary } from "@/hooks/useDictionary";
import Navbar from "@/components/ui/Navbar";

type Tab = "search" | "saved";

export default function DictionaryPage() {
  const [tab, setTab] = useState<Tab>("search");
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  const { results, loading, error, query, hasSearched, search, clearSearch } = useDictionary();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) window.location.replace("/login");
      else setUserEmail(user.email || "");
    });
    return () => unsubscribe();
  }, [router]);

  return (
    <div className="min-h-[100dvh] bg-page font-sans pb-24 md:pb-12">
      <Navbar userEmail={userEmail} />

      <div className="max-w-2xl mx-auto px-4 py-6">

        {/* Header */}
        <div className="mb-5 animate-fade-up">
          <h1 className="text-2xl font-extrabold" style={{ color: "var(--text)" }}>Từ điển Zoldy</h1>
          <p className="text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Tra cứu từ vựng tiếng Anh chuẩn IPA, định nghĩa và ví dụ câu thực tế
          </p>
        </div>

        {/* Tabs */}
        <div className="card p-1.5 mb-5 flex gap-1.5 animate-fade-up rounded-2xl">
          {(["search", "saved"] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold transition-all duration-200"
              style={
                tab === t
                  ? { background: "var(--primary)", color: "#ffffff" }
                  : { color: "var(--text-muted)" }
              }
            >
              {t === "search" ? "🔍 Tra từ" : "📚 Kho từ của tôi"}
            </button>
          ))}
        </div>

        {/* Tab: Search */}
        {tab === "search" && (
          <div className="animate-fade-up flex flex-col gap-4">
            <SearchBar
              query={query}
              onChange={search}
              onClear={clearSearch}
              loading={loading}
              placeholder="Nhập từ tiếng Anh hoặc nghĩa tiếng Việt..."
            />

            <div className="space-y-3">
              {error && (
                <div className="px-4 py-3 rounded-2xl text-sm font-medium"
                  style={{ background: "rgba(239,68,68,0.08)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.15)" }}>
                  {error}
                </div>
              )}

              {!hasSearched && !loading && (
                <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
                  <div className="text-4xl mb-3">📖</div>
                  <p className="font-semibold text-base" style={{ color: "var(--text)" }}>Bắt đầu tra cứu từ mới</p>
                  <p className="text-xs mt-1">Gõ từ tiếng Anh (ví dụ: <span className="font-mono text-[var(--primary)] font-bold">resilience, enhance, achieve</span>) hoặc nghĩa tiếng Việt</p>
                </div>
              )}

              {hasSearched && !loading && results.length === 0 && !error && (
                <div className="text-center py-12 text-sm" style={{ color: "var(--text-muted)" }}>
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-semibold">Không tìm thấy kết quả cho &ldquo;{query}&rdquo;</p>
                  <p className="text-xs mt-1">Vui lòng kiểm tra lại chính tả hoặc thử một từ khác.</p>
                </div>
              )}

              {results.map((word) => (
                <WordDetail key={word.id} word={word} />
              ))}
            </div>
          </div>
        )}

        {/* Tab: Saved */}
        {tab === "saved" && <VocabularyList />}

      </div>
    </div>
  );
}