// src/lib/languages/index.ts
export type LearningLanguage = "en" | "ja" | "ko" | "zh";

export interface LanguageConfig {
  id: LearningLanguage;
  name: string;
  nativeName: string;
  flag: string;
  features: {
    furigana?: boolean;
    strokeOrder?: boolean;
    romanization?: boolean;
    pinyin?: boolean;
    ipa?: boolean;
    fontFamily?: string;
  };
}

export const SUPPORTED_LANGUAGES: Record<LearningLanguage, LanguageConfig> = {
  en: {
    id: "en",
    name: "Tiếng Anh",
    nativeName: "English",
    flag: "🇺🇸",
    features: {
      ipa: true,
    },
  },
  ja: {
    id: "ja",
    name: "Tiếng Nhật",
    nativeName: "日本語",
    flag: "🇯🇵",
    features: {
      furigana: true,
      strokeOrder: true,
      romanization: true,
    },
  },
  ko: {
    id: "ko",
    name: "Tiếng Hàn",
    nativeName: "한국어",
    flag: "🇰🇷",
    features: {
      romanization: true,
    },
  },
  zh: {
    id: "zh",
    name: "Tiếng Trung",
    nativeName: "中文",
    flag: "🇨🇳",
    features: {
      pinyin: true,
      strokeOrder: true,
    },
  },
};

export const DEFAULT_LANGUAGE: LearningLanguage = "en";
