// src/lib/speech.ts
// Web Speech API hỗ trợ đa ngôn ngữ với fix đặc biệt cho iOS Safari

let iosUnlocked = false;

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function unlockSpeechSynthesis(): void {
  if (iosUnlocked || !isSpeechSupported()) return;
  const u = new SpeechSynthesisUtterance("");
  u.volume = 0;
  window.speechSynthesis.speak(u);
  iosUnlocked = true;
}

const LANG_CODE_MAP: Record<string, string> = {
  ja: "ja-JP",
  en: "en-US",
  ko: "ko-KR",
  zh: "zh-CN",
};

function getBestVoice(langCode: string): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  return (
    voices.find((v) => v.lang === langCode && v.localService) ||
    voices.find((v) => v.lang === langCode) ||
    voices.find((v) => v.lang.startsWith(langCode.split("-")[0])) ||
    null
  );
}

export function speakText(
  text: string,
  lang: string = "en",
  slow = false,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: (e: SpeechSynthesisErrorEvent) => void }
): void {
  if (!isSpeechSupported() || !text?.trim()) {
    callbacks?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const langCode = LANG_CODE_MAP[lang] || "en-US";
  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = langCode;
  utterance.rate = slow ? 0.6 : 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (callbacks?.onStart) utterance.onstart = callbacks.onStart;
  utterance.onend = () => callbacks?.onEnd?.();
  utterance.onerror = (e) => {
    console.warn("TTS Error:", e);
    callbacks?.onError?.(e);
    callbacks?.onEnd?.();
  };

  const voice = getBestVoice(langCode);
  if (voice) utterance.voice = voice;

  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 0);
}

export function speakEnglish(
  text: string,
  slow = false,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: (e: SpeechSynthesisErrorEvent) => void }
): void {
  speakText(text, "en", slow, callbacks);
}

export function stopSpeech(): void {
  if (isSpeechSupported()) {
    window.speechSynthesis.cancel();
  }
}

if (typeof window !== "undefined" && "speechSynthesis" in window) {
  if (window.speechSynthesis.onvoiceschanged !== undefined) {
    window.speechSynthesis.onvoiceschanged = () => {
      window.speechSynthesis.getVoices();
    };
  }
}