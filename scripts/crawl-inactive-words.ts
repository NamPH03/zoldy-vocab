import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";
import { getAdminDb } from "../src/lib/firebase-admin";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

const OUTPUT_DATA_FILE = path.resolve(process.cwd(), "mochidemy-inactive-929-words.json");

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
  mochiLevel: number;
  targetLevel: number; // 4
  language?: string;
  source?: string;
}

const SR_INTERVAL_LEVEL4 = 14 * 24 * 60 * 60 * 1000; // 14 ngày cho Mức 4

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

  // Loại bỏ các dấu gạch chéo thừa ở cuối từ
  word = word.replace(/\/+$/, "").trim();

  // Chuẩn hóa IPA
  if (ipa) {
    ipa = ipa.trim();
    if (!ipa.startsWith("/")) ipa = `/${ipa}`;
    if (!ipa.endsWith("/")) ipa = `${ipa}/`;
    ipa = ipa.replace(/'/g, "ˈ").replace(/,/g, "ˌ");
  }

  return { word, ipa };
}

const USER_TOKEN = "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJ1c2VyIjoxMDY2NjU1LCJlbWFpbCI6InBoYW1ob2FpbmFtMDNAZ21haWwuY29tIiwiZGlzcGxheV9uYW1lIjoiUGhcdTFlYTFtIEhvXHUwMGUwaSBOYW0iLCJpc192ZXJpZnkiOjEsInRva2VuIjoiNmE4MmE2MTIzZWY0ZCIsImlwIjoiMTAxLjk2LjEyMS4xNDUiLCJleHAiOjE4MTg0ODMwOTB9.oGTljdgQSroR0pqd3Eiu4cOYE1IIuaY5Ynxq_zP1o7Y";
const PRIVATE_KEY = "M0ch1M0ch1_En_$ecret_k3y";

async function fetchInactiveWords(): Promise<MochidemyWordItem[]> {
  const words: MochidemyWordItem[] = [];
  const seenIds = new Set<string>();
  let page = 1;
  const limit = 30;
  let totalWords = 0;

  console.log("=================================================");
  console.log("📥 ĐANG TẢI TOÀN BỘ TỪ VỰNG TỪ 'SỔ TAY - TỪ CHƯA KÍCH HOẠT / INACTIVE'...");
  console.log("=================================================");

  while (true) {
    const url = `https://mochien-server-release.mochidemy.com/api/v5.0/words/page-beta?user_token=${encodeURIComponent(USER_TOKEN)}&page_level=0&offset=${page}&limit=${limit}&type=0`;

    const resp = await globalThis.fetch(url, {
      headers: {
        authorization: `Bearer ${USER_TOKEN}`,
        privatekey: PRIVATE_KEY,
        accept: "application/json, text/plain, */*",
        referer: "https://learn.mochidemy.com/",
        "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36",
      },
    });

    if (!resp.ok) {
      console.error(`❌ HTTP Error ${resp.status} tại Trang ${page}`);
      break;
    }

    const json: any = await resp.json();
    if (!json || json.code !== 1 || !json.data || !Array.isArray(json.data.list_words)) {
      console.log(`⏹️ Đã hết dữ liệu tại Trang ${page}`);
      break;
    }

    const list = json.data.list_words;
    totalWords = json.total || totalWords;

    if (list.length === 0) break;

    for (const item of list) {
      const rawWord = item.content || item.word || "";
      const rawIpa = item.phonetic || "";
      if (!rawWord || typeof rawWord !== "string") continue;

      const { word, ipa } = cleanWordAndIpa(rawWord, rawIpa);
      if (!word) continue;

      const id = normalizeWordId(word);
      if (seenIds.has(id)) continue;
      seenIds.add(id);

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
        mochiLevel: 5,
        targetLevel: 4, // Đặt vào Mức 4
        language: "en",
        source: "mochidemy_inactive",
      });
    }

    console.log(`  -> Trang ${page}: Đã lấy ${words.length}/${totalWords || list.length} từ`);

    if (list.length < limit || (totalWords > 0 && words.length >= totalWords)) {
      break;
    }

    page++;
    await new Promise((r) => setTimeout(r, 60));
  }

  console.log(`✅ Thu thập hoàn tất: Tổng cộng ${words.length} từ vựng từ mục Inactive.`);
  return words;
}

async function saveInactiveWordsToFirestore(words: MochidemyWordItem[]) {
  const db = getAdminDb();
  console.log("\n=================================================");
  console.log(`💾 BẮT ĐẦU ĐỒNG BỘ ${words.length} TỪ INACTIVE VÀO MỨC 4 TRONG FIRESTORE...`);
  console.log("=================================================");

  // 1. Lưu vocabulary
  console.log(`📦 Đang cập nhật ${words.length} từ vào collection 'vocabulary'...`);
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
        level: "B2",
        language: item.language || "en",
        source: "mochidemy_inactive",
        updatedAt: new Date().toISOString(),
      };
      if (item.audioUrl) vocabData.audioUrl = item.audioUrl;
      if (item.imageUrl) vocabData.imageUrl = item.imageUrl;

      batch.set(vocabRef, vocabData, { merge: true });
    }
    await batch.commit();
    console.log(`  -> Đã lưu ${Math.min(i + batchSize, words.length)}/${words.length} từ vào collection 'vocabulary'`);
  }
  console.log("✅ Đã cập nhật xong collection 'vocabulary'!");

  // Cập nhật version cache
  const version = Date.now();
  await db.collection("meta").doc("vocabVersion_en").set({ version }, { merge: true });

  // 2. Cập nhật user progress vào Mức 4
  const usersSnap = await db.collection("users").get();
  console.log(`👥 Tìm thấy ${usersSnap.size} tài khoản trong hệ thống.`);

  const now = Date.now();
  const nowIso = new Date(now).toISOString();
  const nextReview = new Date(now + SR_INTERVAL_LEVEL4).toISOString();

  for (const userDoc of usersSnap.docs) {
    const uid = userDoc.id;
    console.log(`👤 Đang gán Mức 4 (${words.length} từ) cho user: ${uid} (${userDoc.data().email || "No Email"})...`);

    for (let i = 0; i < words.length; i += batchSize) {
      const batch = db.batch();
      const chunk = words.slice(i, i + batchSize);
      for (const item of chunk) {
        const progRef = db.collection("users").doc(uid).collection("progress").doc(item.id);
        batch.set(progRef, {
          wordId: item.id,
          srLevel: 4,
          status: "learned",
          nextReview: nextReview,
          lastReviewed: nowIso,
          reviewCount: 4,
          language: item.language || "en",
        }, { merge: true });
      }
      await batch.commit();
      console.log(`  -> Đã cập nhật tiến độ ${Math.min(i + batchSize, words.length)}/${words.length} từ cho user`);
    }
  }

  console.log("\n🎉🎉🎉 HOÀN TẤT NẠP TOÀN BỘ TỪ INACTIVE VÀO MỨC 4 THÀNH CÔNG! 🎉🎉🎉");
}

async function main() {
  const words = await fetchInactiveWords();

  fs.writeFileSync(OUTPUT_DATA_FILE, JSON.stringify(words, null, 2), "utf-8");
  console.log(`📁 Đã lưu file backup: ${OUTPUT_DATA_FILE}`);

  if (words.length > 0) {
    await saveInactiveWordsToFirestore(words);
  }
}

main().catch(console.error);
