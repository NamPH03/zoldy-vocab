// src/app/api/dictionary/lookup/route.ts
// Tra cứu từ điển Tiếng Anh: kết hợp DictionaryAPI.dev & Google Translate
import { NextRequest, NextResponse } from "next/server";

function containsVietnamese(text: string): boolean {
  return /[àáạảãâầấậẩẫăằắặẳẵèéẹẻẽêềếệểễìíịỉĩòóọỏõôồốộổỗơờớợởỡùúụủũưừứựửữỳýỵỷỹđÀÁẠẢÃÂẦẤẬẨẪĂẰẮẶẲẴÈÉẸẺẼÊỀẾỆỂỄÌÍỊỈĨÒÓỌỎÕÔỒỐỘỔỖƠỜỚỢỞỠÙÚỤỦŨƯỪỨỰỬỮỲÝỴỶỸĐ]/.test(text);
}

async function translateText(text: string, sl: string, tl: string): Promise<string> {
  if (!text?.trim()) return "";
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text.trim())}`;
    const res = await fetch(url, { headers: { Accept: "application/json" }, signal: controller.signal });
    clearTimeout(timeout);
    if (!res.ok) return text;
    const data = await res.json();
    const translated = Array.isArray(data?.[0])
      ? data[0].map((item: unknown[]) => (typeof item?.[0] === "string" ? item[0] : "")).filter(Boolean).join("")
      : "";
    return translated || text;
  } catch {
    return text;
  }
}

type DictionaryApiMeaning = {
  partOfSpeech: string;
  definitions: Array<{
    definition: string;
    example?: string;
  }>;
};

type DictionaryApiEntry = {
  word: string;
  phonetic?: string;
  phonetics?: Array<{ text?: string; audio?: string }>;
  meanings: DictionaryApiMeaning[];
};

export async function GET(req: NextRequest) {
  const keyword = req.nextUrl.searchParams.get("word");

  if (!keyword || keyword.trim().length < 1) {
    return NextResponse.json({ error: "Missing word" }, { status: 400 });
  }

  try {
    const q = keyword.trim().toLowerCase();
    const isVietnamese = containsVietnamese(q);

    // Nếu người dùng nhập tiếng Việt, dịch sang tiếng Anh trước
    const englishWord = isVietnamese ? await translateText(q, "vi", "en") : q;
    const cleanWord = englishWord.replace(/[^a-zA-Z\s-]/g, "").trim().toLowerCase();

    if (!cleanWord) {
      return NextResponse.json({ data: [] });
    }

    // Gọi Free Dictionary API
    const dictRes = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(cleanWord)}`,
      { headers: { Accept: "application/json" } }
    );

    let entries: DictionaryApiEntry[] = [];
    if (dictRes.ok) {
      entries = await dictRes.json();
    }

    if (!entries || entries.length === 0) {
      // Fallback: Nếu không tìm thấy trong Dictionary API, dùng Google Translate để tạo một mục từ điển cơ bản
      const viMeaning = isVietnamese ? q : await translateText(cleanWord, "en", "vi");
      return NextResponse.json({
        data: [
          {
            word: cleanWord,
            reading: "",
            level: "A1",
            meanings: [
              {
                partOfSpeech: "từ vựng",
                definitions: [
                  {
                    meaning: viMeaning,
                    example: `I am learning the word "${cleanWord}".`,
                    exampleMeaning: `Tôi đang học từ "${cleanWord}".`,
                  },
                ],
              },
            ],
          },
        ],
      });
    }

    // Xử lý và dịch nghĩa định nghĩa sang tiếng Việt
    const transformed = await Promise.all(
      entries.slice(0, 2).map(async (entry) => {
        const phonetic = entry.phonetic || entry.phonetics?.find((p) => p.text)?.text || "";
        const audioUrl = entry.phonetics?.find((p) => p.audio)?.audio || "";

        const meanings = await Promise.all(
          (entry.meanings || []).slice(0, 3).map(async (m) => {
            const defs = await Promise.all(
              (m.definitions || []).slice(0, 2).map(async (d) => {
                const viDef = await translateText(d.definition, "en", "vi");
                const viEx = d.example ? await translateText(d.example, "en", "vi") : "";
                return {
                  meaning: viDef || d.definition,
                  example: d.example || "",
                  exampleMeaning: viEx || "",
                };
              })
            );
            return {
              partOfSpeech: m.partOfSpeech || "khác",
              definitions: defs,
            };
          })
        );

        return {
          word: entry.word,
          reading: phonetic,
          ipa: phonetic,
          audioUrl,
          level: "B1",
          meanings,
        };
      })
    );

    return NextResponse.json({ data: transformed });
  } catch (error) {
    console.error("Dictionary lookup error:", error);
    return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
  }
}
