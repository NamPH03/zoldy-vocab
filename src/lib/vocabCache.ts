// src/lib/vocabCache.ts
// Client-side localStorage cache cho vocabulary collection
// Version-check: thay vì hết hạn theo thời gian (TTL), cache chỉ bị coi là "cũ"
// khi document meta/vocabVersion trên Firestore đổi giá trị. Vocab hầu như không
// đổi (chỉ đổi khi import file hoặc tự thêm từ mới qua tra từ điển), nên cache
// gần như tồn tại vĩnh viễn — mỗi lần mở app chỉ tốn 1 read nhẹ để so version,
// thay vì đọc lại toàn bộ collection (có thể hàng nghìn document).

import { getDocs, getDoc, doc, collection, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export type CachedVocabItem = {
  id: string;
  word: string;
  reading: string;
  ipa?: string;
  meaning: string;
  type: string;
  level: string;
  language?: string;
  example?: string;
  exampleMeaning?: string;
  audioUrl?: string;
  imageUrl?: string;
  courseId?: string;
  lessonId?: string;
  lessonTitle?: string;
  courseName?: string;
  source?: string;
};

type CacheEntry = {
  version: number;
  data: CachedVocabItem[];
};

function getCacheKey(lang: string = "en"): string {
  return `zoldy_vocab_cache_${lang}_v1`;
}

function readCache(lang: string = "en"): CacheEntry | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(getCacheKey(lang));
    if (!raw) return null;
    return JSON.parse(raw) as CacheEntry;
  } catch {
    return null;
  }
}

function writeCache(lang: string = "en", entry: CacheEntry): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(getCacheKey(lang), JSON.stringify(entry));
  } catch {
    // localStorage có thể đầy — bỏ qua, không crash app
  }
}

export function invalidateVocabCache(lang: string = "en"): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(getCacheKey(lang));
}

async function fetchRemoteVersion(lang: string = "en"): Promise<number> {
  try {
    const snap = await getDoc(doc(db, "meta", `vocabVersion_${lang}`));
    if (!snap.exists()) return 0;
    return Number(snap.data().version) || 0;
  } catch {
    return 0;
  }
}

/**
 * Lấy toàn bộ vocabulary theo ngôn ngữ (mặc định "en") — ưu tiên cache localStorage.
 */
export async function getAllVocabulary(lang: string = "en"): Promise<CachedVocabItem[]> {
  const effectiveLang = lang || "en";

  const cached = readCache(effectiveLang);
  const remoteVersion = await fetchRemoteVersion(effectiveLang);

  if (cached && cached.version === remoteVersion && cached.data.length > 0) {
    return cached.data;
  }

  const vocabRef = collection(db, "vocabulary");
  const q = query(vocabRef, where("language", "==", effectiveLang));
  const snap = await getDocs(q);

  const data: CachedVocabItem[] = snap.docs.map((d) => {
    const v = d.data();
    return {
      id: d.id,
      word: v.word || "",
      reading: v.reading || v.ipa || "",
      ipa: v.ipa || v.reading || "",
      meaning: v.meaning || "",
      type: v.type || "",
      level: v.level || "A1",
      language: v.language || effectiveLang,
      example: v.example || "",
      exampleMeaning: v.exampleMeaning || "",
      courseId: v.courseId || "",
      lessonId: v.lessonId || "",
      lessonTitle: v.lessonTitle || "",
      courseName: v.courseName || "",
      source: v.source || "",
    };
  });

  writeCache(effectiveLang, { version: remoteVersion, data });
  return data;
}
