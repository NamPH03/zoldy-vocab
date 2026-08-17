"use client";
import { invalidateVocabCache } from "@/lib/vocabCache";

import { useState } from "react";
import { db, auth } from "@/lib/firebase";
import {
  collection, getDocs, doc, writeBatch, setDoc, query, where,
} from "firebase/firestore";

export default function AdminMigrationPage() {
  const [log, setLog] = useState<string[]>([]);
  const [running, setRunning] = useState(false);

  const addLog = (msg: string) => setLog((prev) => [...prev, msg]);

  const runMigration = async () => {
    if (!auth.currentUser) {
      addLog("❌ Bạn chưa đăng nhập. Hãy đăng nhập trước rồi quay lại trang này.");
      return;
    }
    setRunning(true);
    setLog([]);

    try {
      // === STEP 1: Migration — gán language: "ja" cho dữ liệu cũ ===
      const collectionsToMigrate = ["vocabulary", "lessons", "courses"];
      for (const colName of collectionsToMigrate) {
        addLog(`🚀 Đang quét collection '${colName}'...`);
        const snap = await getDocs(collection(db, colName));
        addLog(`   Tìm thấy ${snap.size} documents.`);

        let updatedCount = 0;
        let batch = writeBatch(db);
        let count = 0;

        for (const docSnap of snap.docs) {
          const data = docSnap.data();
          if (!data.language) {
            batch.update(doc(db, colName, docSnap.id), { language: "ja" });
            updatedCount++;
            count++;

            if (count === 400) {
              await batch.commit();
              addLog(`   Committed batch of ${count} updates...`);
              batch = writeBatch(db);
              count = 0;
            }
          }
        }

        if (count > 0) {
          await batch.commit();
        }

        addLog(`✅ '${colName}': Đã cập nhật ${updatedCount} documents với language: "ja".`);
      }

      // === STEP 2: Import bộ từ vựng mẫu Tiếng Anh ===
      addLog(`\n📚 Kiểm tra từ vựng Tiếng Anh hiện có...`);
      const qEn = query(collection(db, "vocabulary"), where("language", "==", "en"));
      const enSnap = await getDocs(qEn);

      if (!enSnap.empty) {
        addLog(`   Đã có ${enSnap.size} từ Tiếng Anh trong DB. Bỏ qua import.`);
      } else {
        addLog(`   Chưa có từ Tiếng Anh. Đang import bộ mẫu...`);

        const englishVocab = [
          { word: "hello", reading: "/həˈloʊ/", meaning: "xin chào", type: "N", example: "Hello! How are you?", exampleMeaning: "Xin chào! Bạn khỏe không?" },
          { word: "apple", reading: "/ˈæp.əl/", meaning: "quả táo", type: "N", example: "I eat an apple every morning.", exampleMeaning: "Tôi ăn một quả táo mỗi sáng." },
          { word: "book", reading: "/bʊk/", meaning: "quyển sách", type: "N", example: "This is an interesting book.", exampleMeaning: "Đây là một quyển sách thú vị." },
          { word: "water", reading: "/ˈwɑː.t̬ɚ/", meaning: "nước", type: "N", example: "Please give me some water.", exampleMeaning: "Vui lòng cho tôi một ít nước." },
          { word: "friend", reading: "/frend/", meaning: "bạn bè", type: "N", example: "He is my best friend.", exampleMeaning: "Cậu ấy là bạn thân nhất của tôi." },
          { word: "school", reading: "/skuːl/", meaning: "trường học", type: "N", example: "We go to school by bus.", exampleMeaning: "Chúng tôi đến trường bằng xe buýt." },
          { word: "family", reading: "/ˈfæm.əl.i/", meaning: "gia đình", type: "N", example: "I love my family very much.", exampleMeaning: "Tôi yêu gia đình tôi rất nhiều." },
          { word: "happy", reading: "/ˈhæp.i/", meaning: "vui vẻ, hạnh phúc", type: "Adj", example: "She feels happy today.", exampleMeaning: "Cô ấy cảm thấy vui vẻ hôm nay." },
          { word: "learn", reading: "/lɝːn/", meaning: "học tập", type: "V", example: "I learn English every day.", exampleMeaning: "Tôi học tiếng Anh mỗi ngày." },
          { word: "sun", reading: "/sʌn/", meaning: "mặt trời", type: "N", example: "The sun is shining brightly.", exampleMeaning: "Mặt trời đang tỏa sáng rực rỡ." },
        ];

        for (const item of englishVocab) {
          const docId = `en_basic_${item.word}`;
          await setDoc(doc(db, "vocabulary", docId), {
            wordId: docId,
            word: item.word,
            reading: item.reading,
            meaning: item.meaning,
            type: item.type,
            level: "A1",
            language: "en",
            courseId: "ID_en_basic",
            courseName: "Tiếng Anh Cơ Bản",
            lessonId: "ID_en_1",
            lessonTitle: "Lesson 1: Basic Words",
            example: item.example,
            exampleMeaning: item.exampleMeaning,
            status: "new",
            createdAt: new Date().toISOString(),
          }, { merge: true });
          addLog(`   ✅ Added: ${item.word} (${item.reading}) — ${item.meaning}`);
        }

        addLog(`✅ Import hoàn tất: 10 từ Tiếng Anh.`);
      }

      addLog(`\n🎉 Tất cả đã hoàn tất!`);
    } catch (err) {
      addLog(`❌ Lỗi: ${(err as Error).message}`);
    } finally {
      setRunning(false);
      // Invalidate local cache for all supported languages so UI fetches fresh data
      const langs = ["ja", "en", "ko", "zh"] as const;
      langs.forEach((l) => invalidateVocabCache(l));
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: "var(--page)", color: "var(--text)" }}>
      <div className="max-w-2xl mx-auto pt-20">
        <h1 className="text-2xl font-bold mb-2">🔧 Admin: Migration & Import</h1>
        <p className="text-sm mb-6" style={{ color: "var(--text-muted)" }}>
          Gán <code>language: &quot;ja&quot;</code> cho dữ liệu cũ + Import bộ từ vựng mẫu Tiếng Anh
        </p>

        <button
          onClick={runMigration}
          disabled={running}
          className="px-6 py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
          style={{
            background: running ? "var(--surface-2)" : "var(--primary)",
            color: running ? "var(--text-muted)" : "#0d1f14",
            cursor: running ? "wait" : "pointer",
          }}
        >
          {running ? "⏳ Đang chạy..." : "🚀 Chạy Migration + Import"}
        </button>

        {log.length > 0 && (
          <div
            className="mt-6 p-4 rounded-xl text-xs font-mono whitespace-pre-wrap overflow-auto max-h-[60vh]"
            style={{ background: "var(--surface-2)", color: "var(--text)" }}
          >
            {log.join("\n")}
          </div>
        )}
      </div>
    </div>
  );
}
