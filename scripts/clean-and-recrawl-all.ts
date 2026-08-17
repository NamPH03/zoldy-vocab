import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { getAdminDb } from "../src/lib/firebase-admin";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const OUTPUT_DATA_FILE = path.resolve(process.cwd(), "mochidemy-all-2227-words.json");

export interface MochidemyWordItem {
  id: string;
  word: string;
  ipa?: string;
  reading?: string;
  type?: string;
  meaning: string;
  example?: string;
  exampleMeaning?: string;
  audioUrl?: string;
  imageUrl?: string;
  mochiLevel: number; // 1 to 5
  targetLevel: number; // mochiLevel - 1 (0 to 4)
  language?: string;
  source?: string;
}

const SR_INTERVALS: Record<number, number> = {
  1: 1 * 60 * 60 * 1000,        // 1h
  2: 1 * 24 * 60 * 60 * 1000,   // 1d
  3: 5 * 24 * 60 * 60 * 1000,   // 5d
  4: 14 * 24 * 60 * 60 * 1000,  // 14d
  5: 30 * 24 * 60 * 60 * 1000,  // 30d
};

function normalizeWordId(word: string, lang = "en"): string {
  const clean = word
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return `${lang}_${clean}`;
}

function cleanWordAndIpa(rawContent: string, rawPhonetic: string) {
  let word = (rawContent || "").trim();
  let ipa = (rawPhonetic || "").trim();

  // Xử lý trường hợp từ bị dính phiên âm: "astronomical/,æstrə'nɑːmɪkl/" hoặc "all walks of life/ɔːl wɔːks əv laɪf/"
  const slashIndex = word.indexOf("/");
  if (slashIndex !== -1) {
    const wordPart = word.slice(0, slashIndex).trim();
    const phoneticPart = word.slice(slashIndex).trim();
    if (wordPart.length > 0) {
      word = wordPart;
    }
    if (!ipa && phoneticPart.length > 0) {
      ipa = phoneticPart;
    }
  }

  // Loại bỏ các ký tự thừa
  word = word.replace(/\/+$/, "").trim();

  // Chuẩn hóa IPA
  if (ipa) {
    ipa = ipa.trim();
    if (!ipa.startsWith("/")) ipa = `/${ipa}`;
    if (!ipa.endsWith("/")) ipa = `${ipa}/`;
    // Chuẩn hóa dấu nháy đơn trong IPA
    ipa = ipa.replace(/'/g, "ˈ").replace(/,/g, "ˌ");
  }

  return { word, ipa };
}

const USER_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoxMDY2NjU1LCJlbWFpbCI6InBoYW1ob2FpbmFtMDNAZ21haWwuY29tIiwiZGlzcGxheV9uYW1lIjoiUGhcdTFlYTFtIEhvXHUwMGUwaSBOYW0iLCJpc192ZXJpZnkiOjEsInRva2VuIjoiNmE4MmE2MTIzZWY0ZCIsImlwIjoiMTAxLjk2LjEyMS4xNDUiLCJleHAiOjE4MTg0ODMwOTB9.oGTljdgQSroR0pqd3Eiu4cOYE1IIuaY5Ynxq_zP1o7Y";
const PRIVATE_KEY = "M0ch1M0ch1_En_$ecret_k3y";

async function clearEntireFirestoreDatabase() {
  const db = getAdminDb();
  console.log("\n=================================================");
  console.log("🗑️ BẮT ĐẦU DỌN DẸP & XÓA TOÀN BỘ DỮ LIỆU CŨ TRONG FIRESTORE...");
  console.log("=================================================");

  // 1. Xóa toàn bộ collection 'vocabulary'
  console.log("🔥 Đang xóa sạch collection 'vocabulary'...");
  const vocabSnap = await db.collection("vocabulary").get();
  console.log(`  -> Tìm thấy ${vocabSnap.size} từ vựng cũ.`);
  
  const batchSize = 400;
  for (let i = 0; i < vocabSnap.docs.length; i += batchSize) {
    const batch = db.batch();
    const chunk = vocabSnap.docs.slice(i, i + batchSize);
    for (const doc of chunk) {
      batch.delete(doc.ref);
    }
    await batch.commit();
    console.log(`  -> Đã xóa ${Math.min(i + batchSize, vocabSnap.size)}/${vocabSnap.size} từ vựng`);
  }
  console.log("✅ Đã xóa sạch collection 'vocabulary'!");

  // 2. Xóa toàn bộ subcollection 'progress' của tất cả users
  const usersSnap = await db.collection("users").get();
  console.log(`👥 Tìm thấy ${usersSnap.size} users, đang dọn dẹp subcollection 'progress'...`);

  for (const userDoc of usersSnap.docs) {
    const progSnap = await db.collection("users").doc(userDoc.id).collection("progress").get();
    console.log(`  -> User ${userDoc.id}: có ${progSnap.size} progress docs cần xóa.`);
    for (let i = 0; i < progSnap.docs.length; i += batchSize) {
      const batch = db.batch();
      const chunk = progSnap.docs.slice(i, i + batchSize);
      for (const doc of chunk) {
        batch.delete(doc.ref);
      }
      await batch.commit();
    }
    console.log(`  ✅ Đã xóa sạch progress của user: ${userDoc.id}`);
  }

  // 3. Xóa meta cũ
  await db.collection("meta").doc("user_initial_level4_words").delete().catch(() => {});
  console.log("✅ Đã dọn dẹp hoàn tất toàn bộ cơ sở dữ liệu!");
}

async function fetchLevelWords(level: number): Promise<MochidemyWordItem[]> {
  const words: MochidemyWordItem[] = [];
  let page = 1;
  const limit = 30;
  let totalWordsInLevel = 0;

  console.log(`\n=================================================`);
  console.log(`📥 ĐANG TẢI MỨC ${level} (Mochidemy Mức ${level} ➔ Zoldy Mức ${level - 1})...`);
  console.log(`=================================================`);

  while (true) {
    const url = `https://mochien-server-release.mochidemy.com/api/v5.0/words/page-beta?user_token=${encodeURIComponent(USER_TOKEN)}&page_level=${level}&offset=${page}&limit=${limit}&type=1`;

    const resp = await fetch(url, {
      headers: {
        "authorization": `Bearer ${USER_TOKEN}`,
        "privatekey": PRIVATE_KEY,
        "accept": "application/json, text/plain, */*",
        "referer": "https://learn.mochidemy.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
      },
    });

    if (!resp.ok) {
      console.error(`❌ HTTP Error ${resp.status} tại Trang ${page}`);
      break;
    }

    const json: any = await resp.json();
    if (!json || json.code !== 1 || !json.data || !Array.isArray(json.data.list_words)) {
      console.log(`⏹️ Không còn dữ liệu tại Trang ${page}`);
      break;
    }

    const list = json.data.list_words;
    totalWordsInLevel = json.total || totalWordsInLevel;

    if (list.length === 0) {
      break;
    }

    for (const item of list) {
      const rawWord = item.content || item.word || "";
      const rawIpa = item.phonetic || "";
      if (!rawWord || typeof rawWord !== "string") continue;

      const { word, ipa } = cleanWordAndIpa(rawWord, rawIpa);
      if (!word) continue;

      const id = normalizeWordId(word);
      const mochiLevel = level;
      const targetLevel = level === 1 ? 1 : Math.max(1, level - 1);
      const meaning = (item.trans || item.vietnamese || "").trim();
      const type = (item.position || item.pos || "n").trim();
      const audioUrl = (item.audio || "").trim();
      const imageUrl = (item.image || "").trim();

      words.push({
        id,
        word,
        ipa,
        reading: ipa,
        type,
        meaning,
        audioUrl,
        imageUrl,
        mochiLevel,
        targetLevel,
        language: "en",
        source: "mochidemy",
      });
    }

    console.log(`  -> Trang ${page}: Đã lấy ${words.length}/${totalWordsInLevel || list.length} từ`);

    if (list.length < limit || (totalWordsInLevel > 0 && words.length >= totalWordsInLevel)) {
      break;
    }

    page++;
    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`✅ Hoàn thành Mức ${level}: Đã lấy ${words.length} từ vựng chuẩn sạch.`);
  return words;
}

async function saveToFirestore(words: MochidemyWordItem[]) {
  const db = getAdminDb();
  console.log("\n=================================================");
  console.log(`💾 BẮT ĐẦU ĐỒNG BỘ ${words.length} TỪ VỰNG CHUẨN SẠCH VÀO FIRESTORE...`);
  console.log("=================================================");

  // 1. Lưu vocabulary
  console.log(`📦 Đang lưu ${words.length} từ vào collection 'vocabulary'...`);
  const batchSize = 400;
  for (let i = 0; i < words.length; i += batchSize) {
    const batch = db.batch();
    const chunk = words.slice(i, i + batchSize);
    for (const item of chunk) {
      const vocabRef = db.collection("vocabulary").doc(item.id);
      const vocabData: Record<string, any> = {
        word: item.word,
        ipa: item.ipa || "",
        reading: item.reading || item.ipa || "",
        meaning: item.meaning || "",
        type: item.type || "n",
        level: item.targetLevel >= 4 ? "C1" : item.targetLevel === 3 ? "B2" : item.targetLevel === 2 ? "B1" : "A2",
        language: item.language || "en",
        source: "mochidemy",
        updatedAt: new Date().toISOString(),
      };
      if (item.audioUrl) vocabData.audioUrl = item.audioUrl;
      if (item.imageUrl) vocabData.imageUrl = item.imageUrl;

      batch.set(vocabRef, vocabData, { merge: true });
    }
    await batch.commit();
    console.log(`  -> Đã lưu ${Math.min(i + batchSize, words.length)}/${words.length} từ vào collection 'vocabulary'`);
  }
  console.log("✅ Đã cập nhật xong toàn bộ collection 'vocabulary'!");

  // Cập nhật version cache
  const version = Date.now();
  await db.collection("meta").doc("vocabVersion_en").set({ version }, { merge: true });

  // 2. Lưu user progress
  const usersSnap = await db.collection("users").get();
  console.log(`👥 Tìm thấy ${usersSnap.size} tài khoản trong hệ thống.`);

  const now = Date.now();
  const nowIso = new Date(now).toISOString();

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    console.log(`👤 Đang cập nhật tiến độ cho: ${uid} (${userDoc.data().email || "No Email"})...`);

    for (let i = 0; i < words.length; i += batchSize) {
      const batch = db.batch();
      const chunk = words.slice(i, i + batchSize);
      for (const item of chunk) {
        const progRef = db.collection("users").doc(uid).collection("progress").doc(item.id);

        if (item.targetLevel === 0) {
          // Mức 0 -> Từ mới chưa học
          batch.set(progRef, {
            wordId: item.id,
            srLevel: 0,
            status: "new",
            nextReview: null,
            lastReviewed: null,
            reviewCount: 0,
            language: item.language || "en",
          }, { merge: true });
        } else {
          // Mức 1 -> 4
          const interval = SR_INTERVALS[item.targetLevel] || (14 * 24 * 60 * 60 * 1000);
          const nextReview = new Date(now + interval).toISOString();

          batch.set(progRef, {
            wordId: item.id,
            srLevel: item.targetLevel,
            status: "learned",
            nextReview: nextReview,
            lastReviewed: nowIso,
            reviewCount: item.targetLevel,
            language: item.language || "en",
          }, { merge: true });
        }
      }
      await batch.commit();
      console.log(`  -> Đã gán tiến độ ${Math.min(i + batchSize, words.length)}/${words.length} từ cho user`);
    }
  }

  console.log("\n🎉🎉🎉 HOÀN TẤT ĐỒNG BỘ 100% TỪ VỰNG & TIẾN ĐỘ VÀO FIRESTORE! 🎉🎉🎉");
}

async function main() {
  // 1. Xóa toàn bộ DB cũ
  await clearEntireFirestoreDatabase();

  // 2. Tải toàn bộ từ Mochidemy với bộ lọc làm sạch word & ipa
  const allWords: MochidemyWordItem[] = [];
  const seenIds = new Set<string>();

  for (let lvl = 1; lvl <= 5; lvl++) {
    const lvlWords = await fetchLevelWords(lvl);
    for (const w of lvlWords) {
      if (!seenIds.has(w.id)) {
        seenIds.add(w.id);
        allWords.push(w);
      }
    }
  }

  console.log(`\n=================================================`);
  console.log(`🎉 TỔNG SỐ TỪ VỰNG ĐÃ LÀM SẠCH: ${allWords.length} TỪ`);
  console.log(`=================================================`);

  // Lưu file backup
  fs.writeFileSync(OUTPUT_DATA_FILE, JSON.stringify(allWords, null, 2), "utf-8");
  console.log(`📁 File backup đã lưu tại: ${OUTPUT_DATA_FILE}`);

  // Thống kê từng mức
  const stats: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const w of allWords) {
    stats[w.mochiLevel] = (stats[w.mochiLevel] || 0) + 1;
  }

  console.log("\n📊 BẢNG TỔNG KẾT QUY ĐỔI MỨC ĐỘ:");
  for (let lvl = 1; lvl <= 5; lvl++) {
    console.log(`   - Mức ${lvl} Mochidemy: ${stats[lvl] || 0} từ ➔ Mức ${lvl - 1} ZoldyVocab`);
  }

  // 3. Nạp vào Firestore
  if (allWords.length > 0) {
    await saveToFirestore(allWords);
  }
}

main().catch(console.error);
