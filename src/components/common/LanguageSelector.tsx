"use client";

import { useEffect, useState } from "react";
import { getCurrentUser, updateUserLanguage } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { SUPPORTED_LANGUAGES, LearningLanguage } from "@/lib/languages";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface LanguageSelectorProps {
  compact?: boolean;
}

export default function LanguageSelector({ compact = false }: LanguageSelectorProps) {
  const router = useRouter();
  const [currentLang, setCurrentLang] = useState<LearningLanguage>("ja");
  const [isOpen, setIsOpen] = useState(false);
  const user = getCurrentUser();

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      if (snap.exists() && snap.data().currentLanguage) {
        setCurrentLang(snap.data().currentLanguage as LearningLanguage);
      }
    });
    return () => unsub();
  }, [user]);

  const handleSelect = async (lang: LearningLanguage) => {
    setCurrentLang(lang);
    setIsOpen(false);
    if (user) {
      await updateUserLanguage(user.uid, lang);
      // Force Next.js to re‑fetch server‑side data with new language
      router.refresh();
    }
  };

  const activeConfig = SUPPORTED_LANGUAGES[currentLang] || SUPPORTED_LANGUAGES.ja;

  return (
    <div className="relative inline-block text-left">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border transition-all duration-200 text-xs sm:text-sm font-semibold active:scale-95"
        style={{
          borderColor: "var(--border-color)",
          background: "var(--surface-2)",
          color: "var(--text)",
        }}
      >
        <span>{activeConfig.flag}</span>
        {!compact && <span>{activeConfig.name}</span>}
        <span className="text-[10px] opacity-60">▼</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div
            className="absolute right-0 mt-2 w-40 rounded-xl shadow-lg border z-50 py-1.5"
            style={{
              background: "var(--surface)",
              borderColor: "var(--border-color)",
            }}
          >
            {(Object.keys(SUPPORTED_LANGUAGES) as LearningLanguage[]).map((key) => {
              const lang = SUPPORTED_LANGUAGES[key];
              const isSelected = currentLang === key;
              return (
                <button
                  key={key}
                  onClick={() => handleSelect(key)}
                  className={`w-full text-left px-3 py-2 text-xs sm:text-sm flex items-center justify-between transition-colors ${
                    isSelected
                      ? "bg-[var(--primary)]/10 text-[var(--primary)] font-bold"
                      : "hover:bg-[var(--surface-2)] text-[var(--text)]"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <span>{lang.flag}</span>
                    <span>{lang.name}</span>
                  </span>
                  {isSelected && <span className="text-xs">✓</span>}
                </button>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
