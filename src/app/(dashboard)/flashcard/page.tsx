"use client";

import { useEffect, useState, useCallback } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import SpeakButton from "@/components/ui/SpeakButton";
import Navbar from "@/components/ui/Navbar";
import { getAllVocabulary, type CachedVocabItem } from "@/lib/vocabCache";
import { fetchUserProgressDocs } from "@/lib/progress";
import type { ProgressDoc } from "@/lib/progressCache";
import { RotateCw, Volume2, Sparkles, SlidersHorizontal, ArrowLeft, ArrowRight, Check, X } from "lucide-react";

type FlashcardWord = {
  id: string;
  word: string;
  reading?: string;
  ipa?: string;
  meaning: string;
  level?: string;
  type?: string;
  example?: string;
  exampleMeaning?: string;
  audioUrl?: string;
  imageUrl?: string;
  courseId?: string;
  courseName?: string;
  srLevel?: number;
};

const FILTER_OPTIONS = [
  { id: "all", label: "Tất cả từ vựng" },
  { id: "mochi_vocab", label: "Khóa Mochi Vocab" },
  { id: "sr_1", label: "Mức 1 (1 giờ)" },
  { id: "sr_2", label: "Mức 2 (1 ngày)" },
  { id: "sr_3", label: "Mức 3 (5 ngày)" },
  { id: "sr_4", label: "Mức 4 (14 ngày)" },
  { id: "sr_5", label: "Mức 5 (30 ngày)" },
];

export default function FlashcardPage() {
  const [allVocab, setAllVocab] = useState<FlashcardWord[]>([]);
  const [words, setWords] = useState<FlashcardWord[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [known, setKnown] = useState(0);
  const [unknown, setUnknown] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        router.push("/login");
        return;
      }

      try {
        setLoading(true);
        const [vocabList, progressList] = await Promise.all([
          getAllVocabulary("en"),
          fetchUserProgressDocs(user.uid),
        ]);

        const progressMap = new Map<string, ProgressDoc>(
          progressList.map((p: ProgressDoc) => [p.wordId || p.id, p])
        );

        const merged: FlashcardWord[] = vocabList.map((v: CachedVocabItem) => {
          const prog = progressMap.get(v.id);
          return {
            id: v.id,
            word: v.word,
            reading: v.reading || v.ipa || "",
            ipa: v.ipa || v.reading || "",
            meaning: v.meaning,
            level: v.level || "",
            type: v.type || "",
            example: v.example || "",
            exampleMeaning: v.exampleMeaning || "",
            audioUrl: v.audioUrl || "",
            imageUrl: v.imageUrl || "",
            courseId: v.courseId || "",
            courseName: v.courseName || "",
            srLevel: prog ? prog.srLevel : 0,
          };
        });

        setAllVocab(merged);
      } catch (err) {
        console.error("Lỗi tải flashcard:", err);
      } finally {
        setLoading(false);
      }
    });
    return () => unsubscribe();
  }, [router]);

  // Lọc từ theo filter được chọn
  useEffect(() => {
    if (allVocab.length === 0) return;

    let filtered = [...allVocab];
    if (selectedFilter === "mochi_vocab") {
      filtered = allVocab.filter((w) => w.courseId === "mochi_vocab" || w.courseName === "Mochi Vocab");
    } else if (selectedFilter.startsWith("sr_")) {
      const targetSr = parseInt(selectedFilter.replace("sr_", ""), 10);
      filtered = allVocab.filter((w) => w.srLevel === targetSr);
    }

    setWords(filtered.sort(() => Math.random() - 0.5));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnown(0);
    setUnknown(0);
    setFinished(false);
  }, [selectedFilter, allVocab]);

  const nextCard = useCallback(() => {
    setIsFlipped(false);
    setTimeout(() => {
      if (currentIndex + 1 >= words.length) setFinished(true);
      else setCurrentIndex((p) => p + 1);
    }, 250);
  }, [currentIndex, words.length]);

  const handleKnown = useCallback(() => {
    setKnown((p) => p + 1);
    nextCard();
  }, [nextCard]);

  const handleUnknown = useCallback(() => {
    setUnknown((p) => p + 1);
    nextCard();
  }, [nextCard]);

  // ─── Keyboard shortcuts ───
  useEffect(() => {
    if (loading || finished || words.length === 0) return;
    const handleKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;

      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleKnown();
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleUnknown();
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [loading, finished, words.length, handleKnown, handleUnknown]);

  const currentWord = words[currentIndex];
  const progressPct = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;
  const ipa = currentWord ? currentWord.ipa || currentWord.reading : "";

  return (
    <main className="min-h-[100dvh] bg-page pb-24 md:pb-8">
      <Navbar />

      <div className="max-w-xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="text-center mb-6 animate-fade-up">
          <h1 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            🃏 Flashcard Từ Vựng
          </h1>
          <p className="text-xs sm:text-sm mt-1" style={{ color: "var(--text-muted)" }}>
            Lật thẻ 3D trực quan, nghe phát âm bản xứ và ghi nhớ từ vựng phản xạ
          </p>
        </div>

        {/* Bộ lọc Filter Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-5 no-scrollbar">
          <SlidersHorizontal className="w-4 h-4 flex-shrink-0 mr-1" style={{ color: "var(--text-faint)" }} />
          {FILTER_OPTIONS.map((opt) => {
            const active = selectedFilter === opt.id;
            return (
              <button
                key={opt.id}
                onClick={() => setSelectedFilter(opt.id)}
                className="px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap"
                style={
                  active
                    ? { background: "var(--primary)", color: "#ffffff", boxShadow: "0 2px 8px var(--primary-glow)" }
                    : { background: "var(--surface-2)", color: "var(--text-muted)" }
                }
              >
                {opt.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div
              className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }}
            />
          </div>
        ) : words.length === 0 ? (
          <div
            className="card p-12 text-center rounded-3xl border animate-fade-up"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
          >
            <div className="text-4xl mb-3">📭</div>
            <h3 className="text-lg font-bold mb-1" style={{ color: "var(--text)" }}>
              Không có từ nào trong danh mục này
            </h3>
            <p className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Hãy chọn &quot;Tất cả từ vựng&quot; hoặc học thêm từ mới trong mục Bài học!
            </p>
          </div>
        ) : finished ? (
          <div
            className="card p-8 sm:p-10 text-center animate-scale-in rounded-3xl border shadow-lg"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
          >
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: "var(--text)" }}>
              Hoàn thành xuất sắc!
            </h2>
            <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
              Bạn vừa hoàn thành luyện tập {words.length} thẻ từ vựng.
            </p>
            <div className="flex justify-center gap-8 mb-8">
              <div className="p-4 rounded-2xl border" style={{ background: "rgba(34,197,94,0.08)", borderColor: "rgba(34,197,94,0.2)" }}>
                <div className="text-3xl font-black text-green-500">{known}</div>
                <div className="text-xs font-bold mt-1 text-green-600">Đã biết ✅</div>
              </div>
              <div className="p-4 rounded-2xl border" style={{ background: "rgba(239,68,68,0.08)", borderColor: "rgba(239,68,68,0.2)" }}>
                <div className="text-3xl font-black text-red-400">{unknown}</div>
                <div className="text-xs font-bold mt-1 text-red-500">Cần ôn lại ❌</div>
              </div>
            </div>
            <button
              onClick={() => {
                setWords((prev) => [...prev].sort(() => Math.random() - 0.5));
                setCurrentIndex(0);
                setIsFlipped(false);
                setKnown(0);
                setUnknown(0);
                setFinished(false);
              }}
              className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "var(--primary)" }}
            >
              🔄 Luyện tập lại danh mục này
            </button>
          </div>
        ) : (
          <div className="animate-fade-in">
            {/* Thanh tiến độ */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-xs font-bold mb-2" style={{ color: "var(--text-muted)" }}>
                <span>
                  Thẻ {currentIndex + 1} / {words.length}
                </span>
                <span className="flex items-center gap-3">
                  <span className="text-green-500">✓ {known}</span>
                  <span className="text-red-400">✗ {unknown}</span>
                </span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPct}%`, background: "var(--primary)" }}
                />
              </div>
            </div>

            {/* Thẻ Flashcard 3D */}
            <div
              onClick={() => setIsFlipped(!isFlipped)}
              className="cursor-pointer select-none mx-auto min-h-[340px] sm:min-h-[380px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center text-center border shadow-md transition-all hover:shadow-lg relative"
              style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
            >
              {/* Header của thẻ: Type & Level */}
              <div className="w-full flex justify-between items-center">
                <span
                  className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                  style={{ background: "var(--primary-glow)", color: "var(--primary)" }}
                >
                  {currentWord?.srLevel ? `Mức SRS ${currentWord.srLevel}` : "Từ vựng"}
                </span>
                {currentWord?.type && (
                  <span className="text-xs font-semibold italic" style={{ color: "var(--text-muted)" }}>
                    ({currentWord.type})
                  </span>
                )}
              </div>

              {/* Nội dung chính */}
              <div className="my-auto py-4 w-full">
                <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-2" style={{ color: "var(--text)" }}>
                  {currentWord?.word}
                </h2>

                {ipa && (
                  <div className="text-base sm:text-lg font-ipa font-medium mb-4" style={{ color: "var(--primary)" }}>
                    {ipa.startsWith("/") ? ipa : `/${ipa}/`}
                  </div>
                )}

                {isFlipped ? (
                  <div className="animate-fade-in pt-4 border-t max-w-md mx-auto" style={{ borderColor: "var(--border-color)" }}>
                    <div className="text-2xl sm:text-3xl font-extrabold mb-3" style={{ color: "var(--text)" }}>
                      {currentWord?.meaning}
                    </div>
                    {currentWord?.example && (
                      <div
                        className="text-xs font-medium rounded-2xl p-3.5 border text-left"
                        style={{ background: "var(--surface-2)", borderColor: "var(--border-color)", color: "var(--text-muted)" }}
                      >
                        <div className="font-semibold text-sm mb-1" style={{ color: "var(--text)" }}>
                          &ldquo;{currentWord.example}&rdquo;
                        </div>
                        {currentWord.exampleMeaning && <div className="text-xs">{currentWord.exampleMeaning}</div>}
                      </div>
                    )}
                  </div>
                ) : (
                  <div
                    className="text-xs font-semibold animate-pulse mt-4 flex items-center justify-center gap-1.5"
                    style={{ color: "var(--text-faint)" }}
                  >
                    <RotateCw className="w-3.5 h-3.5" /> Chạm hoặc bấm Space để lật thẻ
                  </div>
                )}
              </div>

              {/* Loa phát âm */}
              <div className="w-full flex justify-between items-center pt-2">
                <SpeakButton text={currentWord?.word || ""} audioUrl={currentWord?.audioUrl} size="md" />
                <span className="text-[11px] font-semibold" style={{ color: "var(--text-faint)" }}>
                  {isFlipped ? "Mặt sau" : "Mặt trước"}
                </span>
              </div>
            </div>

            {/* Nút hành động Đã biết / Cần ôn */}
            <div className="flex gap-3 mt-5">
              <button
                onClick={handleUnknown}
                aria-label="Cần ôn lại (phím mũi tên trái)"
                className="flex-1 py-3.5 rounded-2xl text-base font-bold transition-transform active:scale-95 flex items-center justify-center gap-2 border"
                style={{ background: "var(--surface)", borderColor: "var(--border-strong)", color: "var(--text-muted)" }}
              >
                <X className="w-4 h-4 text-red-500" />
                <span>Cần ôn</span>
                <span
                  className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "var(--surface-3)", color: "var(--text-faint)" }}
                >
                  ←
                </span>
              </button>
              <button
                onClick={handleKnown}
                aria-label="Đã thuộc (phím mũi tên phải)"
                className="flex-1 py-3.5 rounded-2xl text-base font-bold text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                style={{ background: "var(--primary)" }}
              >
                <Check className="w-4 h-4" />
                <span>Đã thuộc</span>
                <span
                  className="hidden sm:inline-block text-[10px] px-1.5 py-0.5 rounded font-mono"
                  style={{ background: "rgba(255,255,255,0.2)", color: "#ffffff" }}
                >
                  →
                </span>
              </button>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}