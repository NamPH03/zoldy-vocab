// src/components/dictionary/WordDetail.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { db, auth } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { playAudioOrSpeak, speakEnglish } from "@/lib/speech";
import type { DictionaryWord } from "@/types/dictionary";
import { saveWordFromDictionary } from "@/lib/progress";
import { getAllVocabulary } from "@/lib/vocabCache";
import { Volume2, Bookmark, BookmarkCheck, Database, Globe } from "lucide-react";

type Props = { word: DictionaryWord };

const levelStyle: Record<string, { bg: string; color: string }> = {
  A1: { bg: "rgba(34,197,94,0.12)", color: "#16a34a" },
  A2: { bg: "rgba(14,165,233,0.12)", color: "#0284c7" },
  B1: { bg: "rgba(59,130,246,0.12)", color: "#2563eb" },
  B2: { bg: "rgba(234,179,8,0.12)", color: "#ca8a04" },
  C1: { bg: "rgba(249,115,22,0.12)", color: "#ea580c" },
  TOEIC: { bg: "rgba(168,85,247,0.12)", color: "#9333ea" },
  IELTS: { bg: "rgba(236,72,153,0.12)", color: "#db2777" },
};

type SaveStatus = "idle" | "saving" | "saved" | "already_learning";

export default function WordDetail({ word }: Props) {
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  // Check đã lưu chưa
  useEffect(() => {
    const checkSaved = async () => {
      const user = auth.currentUser;
      if (!user) return;
      try {
        const allVocab = await getAllVocabulary("en");
        const match = allVocab.find((v) => v.word.toLowerCase() === word.word.toLowerCase());
        if (!match) return;
        const progressSnap = await getDoc(doc(db, "users", user.uid, "progress", match.id));
        if (progressSnap.exists() && mounted.current) {
          setSaveStatus("already_learning");
        }
      } catch {
        // ignore
      }
    };
    checkSaved();
  }, [word]);

  const handleSave = async () => {
    const user = auth.currentUser;
    if (!user) return;
    setSaveStatus("saving");
    try {
      const meaning = word.meanings[0]?.definitions[0]?.meaning || "";
      const type = word.meanings[0]?.partOfSpeech || "noun";
      const example = word.meanings[0]?.definitions[0]?.example || "";
      const exampleMeaning = word.meanings[0]?.definitions[0]?.exampleMeaning || "";

      const idToken = await user.getIdToken();
      const res = await fetch("/api/vocabulary/save", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${idToken}` },
        body: JSON.stringify({
          word: word.word,
          reading: word.reading || word.ipa || "",
          ipa: word.ipa || word.reading || "",
          meaning,
          type,
          level: word.level || "A1",
          language: "en",
          example,
          exampleMeaning,
        }),
      });

      if (!res.ok) throw new Error("API error");
      const { wordId } = await res.json();
      if (!wordId) throw new Error("No wordId returned");
      await saveWordFromDictionary(user.uid, wordId);
      setSaveStatus("saved");
    } catch (err) {
      console.error("Lỗi lưu từ:", err);
      setSaveStatus("idle");
    }
  };

  const lvl = levelStyle[word.level || ""] || { bg: "var(--surface-2)", color: "var(--text-muted)" };
  const isLocal = word.source === "local";
  const ipaText = word.ipa || word.reading;
  const audioUrl = (word as any).audioUrl || "";

  return (
    <div className="card p-5 rounded-2xl animate-fade-up flex flex-col gap-4 relative">
      {/* Header: từ + IPA + level + source badge */}
      <div className="flex justify-between items-start gap-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2.5 flex-wrap">
            <span className="text-3xl font-extrabold tracking-tight" style={{ color: "var(--text)" }}>
              {word.word}
            </span>
            {ipaText && (
              <span className="text-base font-ipa font-medium" style={{ color: "var(--primary)" }}>
                {ipaText.startsWith("/") ? ipaText : `/${ipaText}/`}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          {word.level && (
            <span className="badge font-bold text-xs px-2.5 py-1" style={{ background: lvl.bg, color: lvl.color }}>
              {word.level}
            </span>
          )}
          {/* Badge nguồn */}
          <span
            className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full"
            style={isLocal
              ? { background: "rgba(2,132,199,0.12)", color: "#0284c7" }
              : { background: "var(--surface-2)", color: "var(--text-faint)" }
            }
          >
            {isLocal ? <Database className="w-3 h-3" /> : <Globe className="w-3 h-3" />}
            {isLocal ? "Bộ từ chuẩn" : "Từ điển Online"}
          </span>
        </div>
      </div>

      {/* Phát âm */}
      <div className="flex gap-2">
        <button
          onClick={() => playAudioOrSpeak(word.word, audioUrl, false)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 hover:bg-[var(--surface-3)]"
          style={{ background: "var(--surface-2)", color: "var(--text)" }}
        >
          <Volume2 className="w-4 h-4 text-[var(--primary)]" />
          Phát âm giọng Mỹ (US)
        </button>
        <button
          onClick={() => playAudioOrSpeak(word.word, audioUrl, true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all duration-150 active:scale-95 hover:bg-[var(--surface-3)]"
          style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}
        >
          🐢 Chậm
        </button>
      </div>

      {/* Nghĩa */}
      <div className="space-y-3 pt-2 border-t" style={{ borderColor: "var(--border-color)" }}>
        {word.meanings.map((meaning, i) => (
          <div key={i} className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span
                className="text-[11px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-lg"
                style={{ background: "var(--primary-glow)", color: "var(--primary)" }}
              >
                {meaning.partOfSpeech || "Từ loại"}
              </span>
            </div>
            {meaning.definitions.map((def, j) => (
              <div key={j} className="pl-2 flex flex-col gap-1.5">
                <div className="font-semibold text-base" style={{ color: "var(--text)" }}>
                  {meaning.definitions.length > 1 ? `${j + 1}. ` : ""}{def.meaning}
                </div>
                {def.example && (
                  <div className="rounded-xl p-3 border" style={{ background: "var(--surface-2)", borderColor: "var(--border-color)" }}>
                    <div className="text-sm font-medium" style={{ color: "var(--text)" }}>
                      &ldquo;{def.example}&rdquo;
                    </div>
                    {def.exampleMeaning && (
                      <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                        {def.exampleMeaning}
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Footer: Nút Lưu từ vào Sổ tay */}
      <div className="pt-2 border-t flex justify-end" style={{ borderColor: "var(--border-color)" }}>
        {saveStatus === "already_learning" ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl"
            style={{ background: "rgba(2,132,199,0.12)", color: "var(--primary)" }}>
            <BookmarkCheck className="w-4 h-4" />
            Đã có trong sổ tay ôn tập
          </div>
        ) : saveStatus === "saved" ? (
          <div className="flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-xl text-green-600 bg-green-500/10">
            <BookmarkCheck className="w-4 h-4" />
            Đã lưu vào Sổ tay!
          </div>
        ) : (
          <button
            onClick={handleSave}
            disabled={saveStatus === "saving"}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all duration-200 active:scale-95 shadow-sm text-white"
            style={{ background: "var(--primary)" }}
          >
            <Bookmark className="w-4 h-4" />
            {saveStatus === "saving" ? "Đang lưu..." : "Lưu vào Sổ tay"}
          </button>
        )}
      </div>
    </div>
  );
}