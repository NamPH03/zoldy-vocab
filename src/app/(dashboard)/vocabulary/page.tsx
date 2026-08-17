"use client";

// src/app/(dashboard)/vocabulary/page.tsx
// Sổ Tay — Hiển thị TỪ ĐÃ LƯU / ĐÃ HỌC của user theo mức ghi nhớ 1-5 (Spaced Repetition)

import { useEffect, useState, useCallback } from "react";
import { getDocs, collection } from "firebase/firestore";
import { db, auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Navbar from "@/components/ui/Navbar";
import { speakEnglish } from "@/lib/speech";
import { getAllVocabulary } from "@/lib/vocabCache";
import { BookOpen, Volume2, Search, SlidersHorizontal } from "lucide-react";

// ─── Types ───────────────────────────────────────────────────
type NoteWord = {
  id: string;
  word: string;
  reading: string;
  meaning: string;
  level: string;
  type: string;
  srLevel: number;
  nextReview: string | null;
  status: "learned" | "new" | "mastered";
};

// ─── Màu sắc ─────────────────────────────────────────────────
const levelColors: Record<string, { bg: string; color: string }> = {
  A1: { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
  A2: { bg: "rgba(14,165,233,0.12)", color: "#0284c7" },
  B1: { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
  B2: { bg: "rgba(234,179,8,0.12)", color: "#ca8a04" },
  C1: { bg: "rgba(249,115,22,0.12)", color: "#ea580c" },
  TOEIC: { bg: "rgba(168,85,247,0.12)", color: "#9333ea" },
  IELTS: { bg: "rgba(236,72,153,0.12)", color: "#db2777" },
};

const srColors: Record<number, string> = {
  1: "#ef4444", 2: "#f97316", 3: "#eab308", 4: "#3b82f6", 5: "#16a34a",
};

const srBg: Record<number, string> = {
  1: "rgba(239,68,68,0.12)", 2: "rgba(249,115,22,0.12)", 3: "rgba(234,179,8,0.12)",
  4: "rgba(59,130,246,0.12)", 5: "rgba(34,197,94,0.12)",
};

const srLabels: Record<number, string> = {
  1: "Mức 1 — Ôn lại sau 1 giờ",
  2: "Mức 2 — Ôn lại sau 1 ngày",
  3: "Mức 3 — Ôn lại sau 5 ngày",
  4: "Mức 4 — Ôn lại sau 14 ngày",
  5: "Mức 5 — Ôn lại sau 30 ngày",
};

// ─── Helpers ─────────────────────────────────────────────────
function formatNextReview(iso: string | null): string {
  if (!iso) return "Chưa có lịch";
  const diff = new Date(iso).getTime() - Date.now();
  if (diff <= 0) return "Đến hạn ôn ngay";
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(h / 24);
  if (d > 0) return `Còn ${d} ngày`;
  if (h > 0) return `Còn ${h} giờ`;
  return "Còn < 1 giờ";
}

export default function NotebookPage() {
  const [allWords, setAllWords] = useState<NoteWord[]>([]);
  const [filtered, setFiltered] = useState<NoteWord[]>([]);
  const [srStats, setSrStats] = useState<Record<number, number>>({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
  const [masteredCount, setMasteredCount] = useState(0);
  const [selectedSR, setSelectedSR] = useState<number | null>(null);
  const [showMastered, setShowMastered] = useState(false);

  const [search, setSearch] = useState("");
  const [selectedLevel, setSelectedLevel] = useState("Tất cả");

  const [loading, setLoading] = useState(true);
  const [userEmail, setUserEmail] = useState("");
  const router = useRouter();

  // ── Tải dữ liệu progress + vocabulary của user ──────────
  const loadUserNotebook = useCallback(async (uid: string) => {
    setLoading(true);
    try {
      const [progressSnap, allVocab] = await Promise.all([
        getDocs(collection(db, "users", uid, "progress")),
        getAllVocabulary("en"),
      ]);

      const progressDocs = progressSnap.docs.filter((d) => d.id !== "stats");

      if (progressDocs.length === 0) {
        setAllWords([]);
        setFiltered([]);
        setSrStats({ 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 });
        return;
      }

      const vocabMap = new Map(allVocab.map((v) => [v.id, v]));

      const wordDetails: NoteWord[] = [];
      const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let mCount = 0;

      for (const pd of progressDocs) {
        const data = pd.data();
        const wordId = data.wordId || pd.id;
        const vocab = vocabMap.get(wordId);
        if (vocab) {
          const srLv = data.srLevel ?? 0;
          const status = data.status || "new";
          if (status === "mastered") {
            mCount++;
            wordDetails.push({
              id: wordId,
              word: vocab.word || "",
              reading: vocab.reading || vocab.ipa || "",
              meaning: vocab.meaning || "",
              level: vocab.level || "",
              type: vocab.type || "",
              srLevel: 5,
              nextReview: null,
              status: "mastered",
            });
          } else if (srLv >= 1 && srLv <= 5) {
            stats[srLv] = (stats[srLv] || 0) + 1;
            wordDetails.push({
              id: wordId,
              word: vocab.word || "",
              reading: vocab.reading || vocab.ipa || "",
              meaning: vocab.meaning || "",
              level: vocab.level || "",
              type: vocab.type || "",
              srLevel: srLv,
              nextReview: data.nextReview || null,
              status: status as "learned" | "new" | "mastered",
            });
          }
        }
      }

      wordDetails.sort((a, b) => a.srLevel - b.srLevel);
      setAllWords(wordDetails);
      setFiltered(wordDetails);
      setSrStats(stats);
      setMasteredCount(mCount);
    } catch (error) {
      console.error("Lỗi tải sổ tay:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (user) => {
      if (!user) { router.push("/login"); return; }
      setUserEmail(user.email || "");
      loadUserNotebook(user.uid);
    });
    return () => unsub();
  }, [router, loadUserNotebook]);

  // ── Lọc danh sách từ theo tìm kiếm, level, mức SR ──────
  useEffect(() => {
    let result = allWords;

    if (showMastered) {
      result = result.filter((w) => w.status === "mastered");
    } else if (selectedSR !== null) {
      result = result.filter((w) => w.srLevel === selectedSR && w.status !== "mastered");
    } else {
      result = result.filter((w) => w.status !== "mastered");
    }

    if (selectedLevel !== "Tất cả") {
      result = result.filter((w) => w.level === selectedLevel);
    }

    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter((w) =>
        w.word.toLowerCase().includes(q) ||
        w.reading.toLowerCase().includes(q) ||
        w.meaning.toLowerCase().includes(q)
      );
    }

    setFiltered(result);
  }, [allWords, selectedSR, showMastered, selectedLevel, search]);

  const totalInReview = Object.values(srStats).reduce((a, b) => a + b, 0);
  const levels = ["Tất cả", "A1", "A2", "B1", "B2", "C1", "TOEIC", "IELTS"];

  return (
    <div className="min-h-[100dvh] bg-page pb-24 md:pb-12">
      <Navbar userEmail={userEmail} />

      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex justify-between items-start mb-6 animate-fade-up">
          <div>
            <h1 className="text-3xl font-extrabold flex items-center gap-2.5" style={{ color: "var(--text)" }}>
              <BookOpen className="w-8 h-8 text-[var(--primary)]" />
              Sổ tay từ vựng
            </h1>
            <p className="text-sm mt-1 font-medium" style={{ color: "var(--text-muted)" }}>
              Theo dõi toàn bộ từ vựng đã học và tiến độ ghi nhớ Spaced Repetition.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black" style={{ color: "var(--primary)" }}>{totalInReview + masteredCount}</span>
            <div className="text-xs font-semibold" style={{ color: "var(--text-faint)" }}>tổng số từ</div>
          </div>
        </div>

        {/* SR Cards Grid (Bộ lọc mức ghi nhớ 1-5 + Đã thuộc) */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-6 animate-fade-up">
          {[1, 2, 3, 4, 5].map((lvl) => {
            const count = srStats[lvl] || 0;
            const isSelected = selectedSR === lvl && !showMastered;
            return (
              <button
                key={lvl}
                onClick={() => {
                  setShowMastered(false);
                  setSelectedSR(selectedSR === lvl ? null : lvl);
                }}
                className={`card p-3 rounded-2xl border text-center transition-all duration-200 active:scale-95 flex flex-col items-center ${isSelected ? "ring-2" : "hover:border-[var(--primary)]"}`}
                style={{
                  background: isSelected ? srBg[lvl] : "var(--surface)",
                  borderColor: isSelected ? srColors[lvl] : "var(--border-color)",
                }}
              >
                <div className="text-xs font-bold uppercase tracking-wider" style={{ color: srColors[lvl] }}>
                  Mức {lvl}
                </div>
                <div className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>
                  {count}
                </div>
                <div className="text-[10px] mt-1 font-medium" style={{ color: "var(--text-faint)" }}>
                  {lvl === 1 ? "1 giờ" : lvl === 2 ? "1 ngày" : lvl === 3 ? "5 ngày" : lvl === 4 ? "14 ngày" : "30 ngày"}
                </div>
              </button>
            );
          })}

          {/* Tab Đã thuộc (Mastered) */}
          <button
            onClick={() => {
              setSelectedSR(null);
              setShowMastered(!showMastered);
            }}
            className={`card p-3 rounded-2xl border text-center transition-all duration-200 active:scale-95 flex flex-col items-center ${showMastered ? "ring-2 ring-green-500" : "hover:border-green-500"}`}
            style={{
              background: showMastered ? "rgba(34,197,94,0.15)" : "var(--surface)",
              borderColor: showMastered ? "#16a34a" : "var(--border-color)",
            }}
          >
            <div className="text-xs font-bold uppercase tracking-wider text-green-600">
              Đã thuộc
            </div>
            <div className="text-2xl font-black mt-1" style={{ color: "var(--text)" }}>
              {masteredCount}
            </div>
            <div className="text-[10px] mt-1 font-medium text-green-600">
              Vĩnh viễn
            </div>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="card p-3.5 rounded-2xl border mb-6 flex flex-col sm:flex-row gap-3 animate-fade-up"
          style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--text-faint)" }} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm kiếm từ tiếng Anh, phiên âm, nghĩa tiếng Việt..."
              className="input pl-10 pr-4 py-2.5 text-sm rounded-xl w-full border"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-strong)", color: "var(--text)" }}
            />
          </div>

          {/* Level Filter Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <SlidersHorizontal className="w-4 h-4 flex-shrink-0 mr-1" style={{ color: "var(--text-faint)" }} />
            {levels.map((lvl) => {
              const active = selectedLevel === lvl;
              return (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                  style={
                    active
                      ? { background: "var(--primary)", color: "#ffffff" }
                      : { background: "var(--surface-2)", color: "var(--text-muted)" }
                  }
                >
                  {lvl}
                </button>
              );
            })}
          </div>
        </div>

        {/* Vocabulary Word Cards */}
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          </div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center rounded-3xl border animate-fade-up"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>Không có từ vựng nào</h3>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              {search ? "Không tìm thấy từ phù hợp với từ khoá tìm kiếm." : "Hãy học thêm bài học mới hoặc tra từ điển để bổ sung vào sổ tay!"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 animate-fade-up">
            {filtered.map((item) => {
              const lvlStyle = levelColors[item.level] || { bg: "var(--surface-2)", color: "var(--text-muted)" };
              const isMastered = item.status === "mastered";
              const ipa = item.reading;

              return (
                <div
                  key={item.id}
                  className="card p-4 rounded-2xl border flex items-center justify-between gap-3 transition-all hover:shadow-sm"
                  style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-lg font-extrabold" style={{ color: "var(--text)" }}>
                        {item.word}
                      </span>
                      {ipa && (
                        <span className="text-sm font-ipa font-medium" style={{ color: "var(--primary)" }}>
                          {ipa.startsWith("/") ? ipa : `/${ipa}/`}
                        </span>
                      )}
                      {item.level && (
                        <span className="badge text-[10px] font-bold px-2 py-0.5 rounded-full"
                          style={{ background: lvlStyle.bg, color: lvlStyle.color }}>
                          {item.level}
                        </span>
                      )}
                    </div>

                    <div className="text-xs font-medium line-clamp-1" style={{ color: "var(--text-muted)" }}>
                      {item.meaning}
                    </div>

                    <div className="text-[11px] font-semibold mt-1.5 flex items-center gap-2">
                      {isMastered ? (
                        <span className="text-green-600 flex items-center gap-1">
                          ✓ Đã thuộc vĩnh viễn
                        </span>
                      ) : (
                        <span style={{ color: item.nextReview && new Date(item.nextReview).getTime() <= Date.now() ? "#f97316" : "var(--text-faint)" }}>
                          Ôn tập: {formatNextReview(item.nextReview)}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={() => speakEnglish(item.word, false)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center transition-all hover:bg-[var(--surface-2)] active:scale-95"
                      style={{ background: "var(--surface-2)", color: "var(--primary)" }}
                      title="Phát âm"
                    >
                      <Volume2 className="w-4 h-4" />
                    </button>
                    {!isMastered && (
                      <span
                        className="badge text-[10px] font-extrabold px-2.5 py-1 rounded-xl"
                        style={{ background: srBg[item.srLevel], color: srColors[item.srLevel] }}
                      >
                        Mức {item.srLevel}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}