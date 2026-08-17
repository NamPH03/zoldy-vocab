// src/hooks/useDictionary.ts
// Search flow:
// 1. Tìm ngay trong vocabCache (instant, có nghĩa tiếng Việt & IPA chuẩn)
// 2. Song song gọi Dictionary lookup API cho kết quả bổ sung
"use client";

import { useState, useCallback, useRef } from "react";
import type { DictionaryWord } from "@/types/dictionary";
import { getAllVocabulary, type CachedVocabItem } from "@/lib/vocabCache";

type SearchState = {
  results: DictionaryWord[];
  loading: boolean;
  error: string | null;
  query: string;
  hasSearched: boolean;
};

type ApiEntry = {
  word: string;
  reading?: string;
  ipa?: string;
  level?: string;
  audioUrl?: string;
  meanings: Array<{
    partOfSpeech: string;
    definitions: Array<{
      meaning: string;
      example?: string;
      exampleMeaning?: string;
    }>;
  }>;
};

function getLevelNumber(level: string): number {
  switch (level) {
    case "A1": return 1;
    case "A2": return 2;
    case "B1": return 3;
    case "B2": return 4;
    case "C1": return 5;
    case "TOEIC": return 3;
    case "IELTS": return 4;
    default: return 1;
  }
}

// ─── Internal: tìm trong vocabCache (instant O(n)) ───
function searchInCache(allVocab: CachedVocabItem[], q: string): DictionaryWord[] {
  const lower = q.toLowerCase().trim();
  const scored: Array<{ item: CachedVocabItem; score: number }> = [];

  for (const v of allVocab) {
    let score = 0;
    const wordLower = (v.word || "").toLowerCase();
    const readingLower = (v.reading || v.ipa || "").toLowerCase();
    const meaningLower = (v.meaning || "").toLowerCase();

    if (wordLower === lower) score += 10;
    else if (wordLower.startsWith(lower)) score += 7;
    else if (wordLower.includes(lower)) score += 4;

    if (readingLower === lower) score += 8;
    else if (readingLower.startsWith(lower)) score += 5;
    else if (readingLower.includes(lower)) score += 3;

    if (meaningLower.startsWith(lower)) score += 6;
    else if (meaningLower.includes(lower)) score += 2;

    if (score > 0) scored.push({ item: v, score });
  }

  scored.sort((a, b) => b.score - a.score);

  return scored.slice(0, 8).map(({ item: v }) => ({
    id: v.id,
    word: v.word,
    reading: v.reading || v.ipa || "",
    ipa: v.ipa || v.reading || "",
    level: v.level || "A1",
    difficultyLevel: getLevelNumber(v.level || "A1"),
    source: "local",
    language: "en",
    meanings: [{
      partOfSpeech: v.type || "từ vựng",
      definitions: [{
        meaning: v.meaning || "",
        example: v.example || "",
        exampleMeaning: v.exampleMeaning || "",
      }],
    }],
  }));
}

// ─── External: Dictionary API qua route ───
async function searchExternal(q: string): Promise<DictionaryWord[]> {
  const response = await fetch(
    `/api/dictionary/lookup?word=${encodeURIComponent(q.trim())}`
  );
  if (!response.ok) return [];

  const payload = await response.json();
  const entries: ApiEntry[] = payload?.data || [];

  return entries.slice(0, 4).map((entry, index) => ({
    id: `ext_${Date.now()}_${index}`,
    word: entry.word,
    reading: entry.reading || entry.ipa || "",
    ipa: entry.ipa || entry.reading || "",
    level: entry.level || "B1",
    difficultyLevel: getLevelNumber(entry.level || "B1"),
    source: "external",
    language: "en",
    audioUrl: entry.audioUrl,
    meanings: entry.meanings || [],
  }));
}

export function useDictionary() {
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null,
    query: "",
    hasSearched: false,
  });

  const abortControllerRef = useRef<AbortController | null>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((q: string) => {
    setState((prev) => ({ ...prev, query: q }));

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();

    if (!q.trim()) {
      setState({
        results: [],
        loading: false,
        error: null,
        query: "",
        hasSearched: false,
      });
      return;
    }

    // Debounce 250ms
    debounceTimerRef.current = setTimeout(async () => {
      setState((prev) => ({ ...prev, loading: true, error: null, hasSearched: true }));

      try {
        const allVocab = await getAllVocabulary("en");
        const localResults = searchInCache(allVocab, q);

        // Hiển thị kết quả local ngay lập tức
        setState((prev) => ({
          ...prev,
          results: localResults,
          loading: localResults.length === 0, // Chỉ loading nếu chưa có kết quả local
        }));

        // Nếu đã có kết quả local chính xác thì không nhất thiết phải đợi API
        const exactMatch = localResults.some(
          (w) => w.word.toLowerCase() === q.trim().toLowerCase()
        );

        if (!exactMatch) {
          const externalResults = await searchExternal(q);
          setState((prev) => {
            const existingWords = new Set(localResults.map((w) => w.word.toLowerCase()));
            const uniqueExternal = externalResults.filter(
              (w) => !existingWords.has(w.word.toLowerCase())
            );
            return {
              ...prev,
              results: [...localResults, ...uniqueExternal],
              loading: false,
            };
          });
        } else {
          setState((prev) => ({ ...prev, loading: false }));
        }
      } catch (err) {
        console.error("Lỗi tìm kiếm từ điển:", err);
        setState((prev) => ({
          ...prev,
          loading: false,
          error: "Không thể tra từ lúc này. Vui lòng thử lại sau.",
        }));
      }
    }, 250);
  }, []);

  const clearSearch = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (abortControllerRef.current) abortControllerRef.current.abort();
    setState({
      results: [],
      loading: false,
      error: null,
      query: "",
      hasSearched: false,
    });
  }, []);

  return {
    ...state,
    search,
    clearSearch,
  };
}