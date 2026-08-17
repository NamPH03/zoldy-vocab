// src/components/dictionary/VocabularyList.tsx
"use client";

import { useState, useEffect } from "react";
import { db, auth } from "@/lib/firebase";
import { collection, getDocs } from "firebase/firestore";
import { speakEnglish } from "@/lib/speech";
import { getAllVocabulary } from "@/lib/vocabCache";
import { Volume2 } from "lucide-react";

type DisplayWord = {
  id: string; // wordId
  word: string;
  reading: string;
  meaning: string;
  srLevel: number;
  nextReview: string | null;
};

const srLevelLabel: Record<number, { label: string; bg: string; color: string }> = {
  1: { label: "Mức 1", bg: "rgba(239,68,68,0.12)", color: "#ef4444" },
  2: { label: "Mức 2", bg: "rgba(249,115,22,0.12)", color: "#f97316" },
  3: { label: "Mức 3", bg: "rgba(234,179,8,0.12)", color: "#eab308" },
  4: { label: "Mức 4", bg: "rgba(59,130,246,0.12)", color: "#3b82f6" },
  5: { label: "Đã thuộc", bg: "rgba(34,197,94,0.12)", color: "#22c55e" },
};

type Filter = "all" | "due" | "mastered";

export default function VocabularyList() {
  const [words, setWords] = useState<DisplayWord[]>([]);
  const [filter, setFilter] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchWords = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const [progressSnap, allVocab] = await Promise.all([
          getDocs(collection(db, "users", user.uid, "progress")),
          getAllVocabulary("en"),
        ]);

        const vocabMap = new Map(allVocab.map((v) => [v.id, v]));
        const now = new Date().toISOString();

        const result: DisplayWord[] = [];
        progressSnap.docs.forEach((d) => {
          if (d.id === "stats") return;
          const data = d.data();
          if (data.status !== "learned") return;
          const vocab = vocabMap.get(d.id);
          if (!vocab) return;
          result.push({
            id: d.id,
            word: vocab.word,
            reading: vocab.reading || vocab.ipa || "",
            meaning: vocab.meaning,
            srLevel: data.srLevel || 1,
            nextReview: data.nextReview || null,
          });
        });

        // Sắp xếp: đến hạn ôn trước, sau đó theo mức SR
        result.sort((a, b) => {
          const aDue = !a.nextReview || a.nextReview <= now;
          const bDue = !b.nextReview || b.nextReview <= now;
          if (aDue && !bDue) return -1;
          if (!aDue && bDue) return 1;
          return a.srLevel - b.srLevel;
        });

        setWords(result);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWords();
  }, []);

  const now = new Date().toISOString();
  const due = words.filter((w) => !w.nextReview || w.nextReview <= now);
  const mastered = words.filter((w) => w.srLevel >= 5);

  const filtered =
    filter === "all" ? words :
    filter === "due" ? due :
    mastered;

  function formatNextReview(nextReview: string | null): string {
    if (!nextReview) return "Ôn ngay";
    const diff = new Date(nextReview).getTime() - Date.now();
    if (diff <= 0) return "Ôn ngay";
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(h / 24);
    if (d >= 1) return `${d} ngày nữa`;
    if (h >= 1) return `${h} giờ nữa`;
    return "Sắp ôn";
  }

  if (loading) return (
    <div className="flex justify-center py-10">
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin"
        style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
    </div>
  );

  return (
    <div className="animate-fade-up">
      {/* Stats summary */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        {[
          { key: "all" as Filter, label: "Tất cả", count: words.length, color: "var(--text)" },
          { key: "due" as Filter, label: "Cần ôn", count: due.length, color: "#f97316" },
          { key: "mastered" as Filter, label: "Đã thuộc", count: mastered.length, color: "#16a34a" },
        ].map(({ key, label, count, color }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            className="p-3.5 rounded-2xl text-center transition-all duration-200"
            style={filter === key
              ? { background: "var(--primary)", color: "#ffffff" }
              : { background: "var(--surface-2)", color: "var(--text-muted)", border: "1px solid var(--border-color)" }
            }
          >
            <div className="text-2xl font-black" style={{ color: filter === key ? "#ffffff" : color }}>{count}</div>
            <div className="text-xs font-semibold mt-0.5">{label}</div>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-5xl mb-3">📭</div>
          <p style={{ color: "var(--text-muted)" }}>
            {filter === "all" ? "Chưa lưu từ nào. Hãy tìm và lưu từ ở tab Tra từ!" : "Không có từ nào trong mục này."}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {filtered.map((word, i) => {
            const levelInfo = srLevelLabel[word.srLevel] || srLevelLabel[1];
            const isDue = !word.nextReview || word.nextReview <= now;
            const ipa = word.reading;
            return (
              <div
                key={word.id}
                className="card px-4 py-3 flex items-center gap-3 animate-fade-up rounded-2xl"
                style={{ animationDelay: `${Math.min(i, 20) * 25}ms` }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="font-extrabold text-base" style={{ color: "var(--text)" }}>{word.word}</span>
                    {ipa && (
                      <span className="text-xs font-mono font-medium" style={{ color: "var(--primary)" }}>
                        {ipa.startsWith("/") ? ipa : `/${ipa}/`}
                      </span>
                    )}
                  </div>
                  <div className="text-sm truncate font-medium" style={{ color: "var(--text-muted)" }}>{word.meaning}</div>
                  <div className="text-[11px] font-semibold mt-1" style={{ color: isDue ? "#f97316" : "var(--text-faint)" }}>
                    {formatNextReview(word.nextReview)}
                  </div>
                </div>

                <button
                  onClick={() => speakEnglish(word.word, false)}
                  className="w-9 h-9 rounded-full flex items-center justify-center transition-all duration-150 flex-shrink-0 active:scale-90"
                  style={{ background: "var(--surface-2)", color: "var(--primary)" }}
                  title="Phát âm"
                >
                  <Volume2 className="w-4 h-4" />
                </button>

                <span
                  className="badge flex-shrink-0 text-[11px] font-bold px-2.5 py-1 rounded-xl"
                  style={{ background: levelInfo.bg, color: levelInfo.color }}
                >
                  {levelInfo.label}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}