import * as dotenv from "dotenv";
import * as path from "path";
import { getAdminDb } from "../src/lib/firebase-admin";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// Shuffle array ngẫu nhiên (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

async function main() {
  const db = getAdminDb();
  console.log("=================================================");
  console.log("🚀 BẮT ĐẦU TẠO KHÓA HỌC 'MOCHI VOCAB' & CHIA BÀI HỌC RANDOM");
  console.log("=================================================");

  // 1. Lấy toàn bộ từ vựng hiện có trong Firestore
  const vocabSnap = await db.collection("vocabulary").get();
  console.log(`📦 Tìm thấy ${vocabSnap.size} từ vựng trong Firestore.`);

  if (vocabSnap.empty) {
    console.log("❌ Không có từ vựng nào để phân chia!");
    return;
  }

  const docs = vocabSnap.docs;
  // Xáo trộn ngẫu nhiên toàn bộ từ
  const shuffledDocs = shuffleArray(docs);

  const WORDS_PER_LESSON = 20;
  const totalLessons = Math.ceil(shuffledDocs.length / WORDS_PER_LESSON);

  console.log(`📊 Tổng số bài học sẽ tạo: ${totalLessons} bài (${WORDS_PER_LESSON} từ/bài).`);
  console.log(`🏷️ Tên khóa học: Mochi Vocab (courseId: 'mochi_vocab')`);
  console.log(`🗑️ Đồng thời xóa bỏ trường 'level' không chính xác.`);

  const batchSize = 400;
  let updatedCount = 0;

  // Chuẩn bị các batch updates
  for (let i = 0; i < shuffledDocs.length; i += batchSize) {
    const batch = db.batch();
    const chunk = shuffledDocs.slice(i, i + batchSize);

    for (let k = 0; k < chunk.length; k++) {
      const globalIndex = i + k;
      const lessonNumber = Math.floor(globalIndex / WORDS_PER_LESSON) + 1;
      const lessonPad = String(lessonNumber).padStart(3, "0");
      const lessonId = `mochi_lesson_${lessonPad}`;
      const lessonTitle = `Bài ${lessonNumber} Mochi Vocab Random`;

      const docRef = chunk[k].ref;
      const existingData = chunk[k].data();

      const updateData: Record<string, any> = {
        courseId: "mochi_vocab",
        courseName: "Mochi Vocab",
        lessonId: lessonId,
        lessonTitle: lessonTitle,
        level: "", // Xóa level không chính xác
        updatedAt: new Date().toISOString(),
      };

      // Xóa ví dụ nếu rỗng
      if (!existingData.example) {
        updateData.example = "";
        updateData.exampleMeaning = "";
      }

      batch.update(docRef, updateData);
      updatedCount++;
    }

    await batch.commit();
    console.log(`  -> Đã cập nhật ${updatedCount}/${shuffledDocs.length} từ vựng...`);
  }

  // Cập nhật version cache để Next.js app tự động làm mới
  const version = Date.now();
  await db.collection("meta").doc("vocabVersion_en").set({ version }, { merge: true });

  console.log("\n=================================================");
  console.log(`🎉 HOÀN TẤT THÀNH CÔNG!`);
  console.log(`✅ Đã phân chia ${updatedCount} từ vựng vào ${totalLessons} bài học trong khóa 'Mochi Vocab'.`);
  console.log(`✅ Mỗi bài học chứa ~${WORDS_PER_LESSON} từ ngẫu nhiên (Bài 1 Mochi Vocab Random ... Bài ${totalLessons} Mochi Vocab Random).`);
  console.log(`✅ Đã xóa toàn bộ level không chính xác.`);
  console.log("=================================================");
}

main().catch(console.error);
