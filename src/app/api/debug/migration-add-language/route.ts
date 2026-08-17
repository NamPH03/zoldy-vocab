// src/app/api/debug/migration-add-language/route.ts
import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps } from "firebase/app";
import { getFirestore, collection, getDocs, doc, writeBatch, setDoc, query, where } from "firebase/firestore";

export const dynamic = "force-dynamic";

// Khởi tạo Client SDK trong API Route (dùng API Key công khai, không đòi hỏi FIREBASE_PRIVATE_KEY)
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);

export async function GET(req: NextRequest) {
  const secret = req.nextUrl.searchParams.get("secret");
  const cronSecret = process.env.CRON_SECRET;
  const isDev = process.env.NODE_ENV === "development";

  if (secret !== cronSecret && !isDev) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const results: Record<string, number> = {};

    const collectionsToMigrate = ["vocabulary", "lessons", "courses"];
    for (const colName of collectionsToMigrate) {
      const snap = await getDocs(collection(db, colName));
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
            batch = writeBatch(db);
            count = 0;
          }
        }
      }

      if (count > 0) {
        await batch.commit();
      }

      results[colName] = updatedCount;
    }

    // Import bộ từ vựng mẫu Tiếng Anh nếu chưa có
    const qEn = query(collection(db, "vocabulary"), where("language", "==", "en"));
    const enSnap = await getDocs(qEn);
    let importedEnCount = 0;

    if (enSnap.empty || req.nextUrl.searchParams.get("import_en") === "true") {
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
        importedEnCount++;
      }
    }

    return NextResponse.json({
      success: true,
      migratedDocuments: results,
      importedEnCount,
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
