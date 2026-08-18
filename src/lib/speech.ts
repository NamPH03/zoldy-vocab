// src/lib/speech.ts
// Dual-Engine Audio: Phát âm bản xứ chất lượng cao (Native Audio) + Web Speech API fallback

let iosUnlocked = false;
let currentAudioInstance: HTMLAudioElement | null = null;

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

function getBestEnglishVoice(): SpeechSynthesisVoice | null {
  if (!isSpeechSupported()) return null;
  const voices = window.speechSynthesis.getVoices();
  // Ưu tiên các giọng tiếng Anh chất lượng cao tự nhiên
  return (
    voices.find((v) => (v.lang === "en-US" || v.lang === "en-GB") && v.localService) ||
    voices.find((v) => v.lang === "en-US") ||
    voices.find((v) => v.lang === "en-GB") ||
    voices.find((v) => v.lang.startsWith("en")) ||
    null
  );
}

export function speakEnglish(
  text: string,
  slow = false,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: (e: SpeechSynthesisErrorEvent) => void }
): void {
  if (!isSpeechSupported() || !text?.trim()) {
    callbacks?.onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text.trim());
  utterance.lang = "en-US";
  utterance.rate = slow ? 0.65 : 1.0;
  utterance.pitch = 1.0;
  utterance.volume = 1.0;

  if (callbacks?.onStart) utterance.onstart = callbacks.onStart;
  utterance.onend = () => callbacks?.onEnd?.();
  utterance.onerror = (e) => {
    console.warn("TTS Error:", e);
    callbacks?.onError?.(e);
    callbacks?.onEnd?.();
  };

  const voice = getBestEnglishVoice();
  if (voice) utterance.voice = voice;

  setTimeout(() => {
    window.speechSynthesis.speak(utterance);
  }, 0);
}

export function playAudioOrSpeak(
  text: string,
  audioUrl?: string,
  slow = false,
  callbacks?: { onStart?: () => void; onEnd?: () => void; onError?: (e: any) => void }
): void {
  stopSpeech();

  if (audioUrl && typeof window !== "undefined") {
    try {
      const audio = new Audio(audioUrl);
      currentAudioInstance = audio;
      audio.playbackRate = slow ? 0.75 : 1.0;
      
      audio.onplay = () => callbacks?.onStart?.();
      audio.onended = () => {
        currentAudioInstance = null;
        callbacks?.onEnd?.();
      };
      audio.onerror = (e) => {
        currentAudioInstance = null;
        speakEnglish(text, slow, callbacks);
      };
      
      audio.play().catch(() => {
        currentAudioInstance = null;
        speakEnglish(text, slow, callbacks);
      });
      return;
    } catch {
      currentAudioInstance = null;
    }
  }

  speakEnglish(text, slow, callbacks);
}

export function stopSpeech(): void {
  if (currentAudioInstance) {
    try {
      currentAudioInstance.pause();
      currentAudioInstance = null;
    } catch {}
  }
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