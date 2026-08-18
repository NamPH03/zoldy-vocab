"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { promoteWord, demoteWord, markStudiedToday, getDueWordsWithVocab } from "@/lib/progress";
import { useRouter } from "next/navigation";
import SpeakButton from "@/components/ui/SpeakButton";
import { playAudioOrSpeak, speakEnglish } from "@/lib/speech";
import type { CachedVocabItem } from "@/lib/vocabCache";
import { sfx } from "@/lib/sfx";
import SessionCompletionModal from "@/components/ui/SessionCompletionModal";
import { Volume2, ArrowRight, CheckCircle2, RotateCw } from "lucide-react";

// ===== TYPES =====
type Vocabulary = {
  id: string; word: string; reading?: string; ipa?: string; type?: string; meaning: string; level: string;
  example?: string; exampleMeaning?: string; audioUrl?: string; imageUrl?: string;
};
type ReviewWord = CachedVocabItem & { wordId: string; srLevel: number; nextReview: string; reviewCount: number; };
type ReviewStep = "meaning-to-word" | "word-to-meaning" | "type-spelling" | "listening";

const BASE_STEPS: ReviewStep[] = ["meaning-to-word", "word-to-meaning", "listening"];

const stepLabel: Record<ReviewStep, string> = {
  "meaning-to-word": "Nghĩa → Chọn từ",
  "word-to-meaning": "Từ → Chọn nghĩa",
  "type-spelling": "Gõ chính tả từ",
  "listening": "Nghe → Chọn nghĩa",
};

// ===== HELPERS =====
function getStepsForWord(): ReviewStep[] {
  return [...BASE_STEPS];
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function cleanStr(s: string): string {
  return (s || "").replace(/\s*[\(（].*?[\)）]/g, "").trim();
}

function generateChoices(correct: ReviewWord, allWords: Vocabulary[], type: "word" | "meaning"): string[] {
  const correctValue = type === "word" ? cleanStr(correct.word) : correct.meaning.trim();

  // Pool: lọc bỏ chính từ hiện tại và các giá trị trùng với đáp án đúng
  const pool = allWords
    .filter((w) => {
      const wVal = type === "word" ? cleanStr(w.word) : w.meaning.trim();
      if (wVal === correctValue) return false;
      return wVal.length > 0;
    })
    .map((w) => (type === "word" ? cleanStr(w.word) : w.meaning.trim()))
    .filter((v, i, arr) => arr.indexOf(v) === i);

  const shuffledPool = pool.sort(() => Math.random() - 0.5);
  const others = shuffledPool.slice(0, 3);

  const allChoices = [correctValue, ...others];

  while (allChoices.length < 4) {
    allChoices.push(`― (khác)`);
  }

  return allChoices.sort(() => Math.random() - 0.5);
}

// ===== MAIN COMPONENT =====
export default function ReviewPage() {
  const inputRef = useRef<HTMLInputElement | null>(null);

  // ─── State ───
  const [dueWords, setDueWords] = useState<ReviewWord[]>([]);
  const [allWords, setAllWords] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<ReviewStep>("meaning-to-word");
  const [remainingSteps, setRemainingSteps] = useState<ReviewStep[]>([]);
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [typedAnswer, setTypedAnswer] = useState("");
  const [forgotThisWord, setForgotThisWord] = useState(false);
  const [doneCount, setDoneCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [finished, setFinished] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [isChecked, setIsChecked] = useState(false);
  const [reinsertedWordIds, setReinsertedWordIds] = useState<Set<string>>(new Set());

  const router = useRouter();
  const studiedTodayRef = useRef(false);
  const isProcessingRef = useRef(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) { router.push("/login"); return; }

      try {
        const { dueWords: dueProgress, allVocab } = await getDueWordsWithVocab(user.uid, 50);
        const vocabMap = new Map(allVocab.map((v) => [v.id, v]));

        const reviewWords: ReviewWord[] = [];
        for (const progress of dueProgress) {
          const vocab = vocabMap.get(progress.id);
          if (vocab) {
            reviewWords.push({
              ...vocab,
              wordId: progress.id,
              srLevel: progress.srLevel || 1,
              nextReview: progress.nextReview || "",
              reviewCount: (progress as { reviewCount?: number }).reviewCount || 0,
            });
          }
        }

        setAllWords(allVocab as Vocabulary[]);
        setDueWords(reviewWords);
      } catch (err) { console.error(err); }
      finally { setLoading(false); }
    });
    return () => unsub();
  }, [router]);

  const initWord = useCallback((word: ReviewWord, usedSoFar: ReviewStep[]) => {
    const available = getStepsForWord().filter((s) => !usedSoFar.includes(s));
    const picked = pickRandom(available);
    const remaining = available.filter((s) => s !== picked);
    setCurrentStep(picked);
    setRemainingSteps(remaining);
    setSelectedChoice(null);
    setSelectedAnswer(null);
    setAnswerStatus("idle");
    setIsChecked(false);
    setTypedAnswer("");
    setForgotThisWord(false);
    if (picked === "meaning-to-word") setChoices(generateChoices(word, allWords, "word"));
    else if (picked === "word-to-meaning" || picked === "listening") setChoices(generateChoices(word, allWords, "meaning"));
  }, [allWords]);

  const isInitializedRef = useRef(false);
  useEffect(() => {
    if (!isInitializedRef.current && dueWords.length > 0 && allWords.length > 0) {
      isInitializedRef.current = true;
      initWord(dueWords[0], []);
    }
  }, [dueWords, allWords, initWord]);

  const currentWord = dueWords[currentIndex];

  useEffect(() => {
    if (!currentWord) return;
    if (currentStep === "listening" && !isChecked) {
      const t = setTimeout(() => playAudioOrSpeak(currentWord.word, currentWord.audioUrl, false), 300);
      return () => clearTimeout(t);
    }
    if (isChecked) {
      const t = setTimeout(() => playAudioOrSpeak(currentWord.word, currentWord.audioUrl, false), 200);
      return () => clearTimeout(t);
    }
  }, [currentStep, currentWord?.wordId, isChecked]);

  const handleResult = async (remembered: boolean) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;

    try {
      const isRecheck = reinsertedWordIds.has(currentWord.wordId);

      if (!remembered) {
        setForgotThisWord(true);
        if (!isRecheck) {
          await finishWord(false);
          return;
        }

        const allPossibleSteps = getStepsForWord();
        let available = remainingSteps.length > 0 ? remainingSteps : allPossibleSteps.filter(s => s !== currentStep);
        if (available.length === 0) available = allPossibleSteps;

        const next = pickRandom(available);
        const newRemaining = available.filter((s) => s !== next);

        setCurrentStep(next);
        setRemainingSteps(newRemaining);
        setSelectedChoice(null);
        setSelectedAnswer(null);
        setAnswerStatus("idle");
        setIsChecked(false);
        setTypedAnswer("");

        if (next === "meaning-to-word") setChoices(generateChoices(currentWord, allWords, "word"));
        else if (next === "word-to-meaning" || next === "listening") setChoices(generateChoices(currentWord, allWords, "meaning"));
      } else {
        await finishWord(!forgotThisWord);
      }
    } catch (err) {
      console.error("Lỗi xử lý kết quả:", err);
    } finally {
      isProcessingRef.current = false;
    }
  };

  const finishWord = async (promote: boolean) => {
    const user = auth.currentUser; if (!user) return;
    const isRecheck = reinsertedWordIds.has(currentWord.wordId);

    if (!isRecheck) {
      if (promote) await promoteWord(user.uid, currentWord.wordId, currentWord.srLevel || 1, currentWord.reviewCount || 0);
      else await demoteWord(user.uid, currentWord.wordId, currentWord.srLevel || 1);
    }

    if (!studiedTodayRef.current) {
      await markStudiedToday(user.uid);
      studiedTodayRef.current = true;
    }

    if (!promote && !isRecheck) {
      const remaining = dueWords.length - (currentIndex + 1);
      if (remaining > 0) {
        setReinsertedWordIds((prev) => new Set(Array.from(prev).concat(currentWord.wordId)));
        const minOffset = remaining >= 3 ? 2 : (remaining >= 2 ? 1 : 0);
        const randomOffset = minOffset + Math.floor(Math.random() * (remaining - minOffset));
        const insertAt = currentIndex + 1 + randomOffset;
        const newQueue = [...dueWords];
        newQueue.splice(insertAt, 0, currentWord);
        setDueWords(newQueue);
        const nextIdx = currentIndex + 1;
        setCurrentIndex(nextIdx);
        initWord(newQueue[nextIdx], []);
        return;
      }
    }

    setDoneCount((p) => p + 1);
    if (currentIndex + 1 >= dueWords.length) { setFinished(true); }
    else { const nextIdx = currentIndex + 1; setCurrentIndex(nextIdx); initWord(dueWords[nextIdx], []); }
  };

  const handleSelectChoice = (choice: string) => {
    if (isChecked) return;
    setSelectedChoice(choice);
  };

  const canAdvanceRef = useRef<number>(0);

  const handleCheckAnswer = () => {
    if (isChecked) return;
    canAdvanceRef.current = Date.now() + 500;
    if (currentStep === "type-spelling") {
      const correct = currentWord.word.trim().toLowerCase();
      const isRight = typedAnswer.trim().toLowerCase() === correct;
      setAnswerStatus(isRight ? "correct" : "wrong");
      setIsChecked(true);
      if (isRight) sfx.playCorrect();
      else sfx.playWrong();
    } else {
      if (!selectedChoice) return;
      let correct = "";
      if (currentStep === "meaning-to-word") correct = cleanStr(currentWord.word);
      else if (currentStep === "word-to-meaning" || currentStep === "listening") correct = currentWord.meaning.trim();
      const isRight = selectedChoice === correct;
      setSelectedAnswer(selectedChoice);
      setAnswerStatus(isRight ? "correct" : "wrong");
      setIsChecked(true);
      if (isRight) sfx.playCorrect();
      else sfx.playWrong();
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || finished || dueWords.length === 0) return;

      if (e.key === "Enter" && currentStep === "type-spelling" && !isChecked) {
        return;
      }

      if (e.key === "Enter") {
        e.preventDefault();
        if (!isChecked) {
          if (selectedChoice) handleCheckAnswer();
        } else {
          if (Date.now() >= canAdvanceRef.current && !isProcessingRef.current) {
            handleResult(answerStatus === "correct");
          }
        }
        return;
      }

      if (currentStep !== "type-spelling" && !isChecked && ["1","2","3","4"].includes(e.key)) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (choices[idx]) handleSelectChoice(choices[idx]);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, finished, dueWords, currentStep, isChecked, selectedChoice, answerStatus, choices]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Đang tải danh sách từ cần ôn...</p>
        </div>
      </div>
    );
  }

  if (dueWords.length === 0) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center animate-fade-up">
        <div className="card p-8 rounded-3xl border shadow-sm" style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4"
            style={{ background: "rgba(34,197,94,0.12)", color: "#16a34a" }}>
            ✨
          </div>
          <h2 className="text-2xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Không có từ đến hạn ôn!</h2>
          <p className="text-xs leading-relaxed font-medium mb-6" style={{ color: "var(--text-muted)" }}>
            Bạn đã ôn tập xuất sắc toàn bộ từ vựng theo lịch Spaced Repetition hôm nay. Hãy học thêm bài mới hoặc quay lại sau!
          </p>
          <div className="flex flex-col gap-2.5">
            <button onClick={() => router.push("/learn")} className="w-full py-3.5 rounded-2xl font-bold text-sm text-white shadow-sm" style={{ background: "var(--primary)" }}>
              Học bài mới
            </button>
            <button onClick={() => router.push("/dashboard")} className="w-full py-3.5 rounded-2xl font-bold text-sm border hover:bg-[var(--surface-2)]" style={{ borderColor: "var(--border-color)", color: "var(--text)" }}>
              Về Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (finished) {
    return (
      <SessionCompletionModal
        title="Hoàn thành phiên ôn tập!"
        totalWords={doneCount}
        nextLessonUrl="/dashboard"
        onRestart={() => window.location.reload()}
      />
    );
  }

  const progressPercent = ((currentIndex) / dueWords.length) * 100;
  const ipa = currentWord?.reading || currentWord?.ipa;

  return (
    <div className="max-w-xl mx-auto px-4 py-4 select-none">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowExitModal(true)}
          className="text-xs font-bold px-3 py-1.5 rounded-xl border hover:bg-[var(--surface-2)] transition-colors"
          style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
        >
          ✕ Dừng ôn
        </button>

        <div className="flex-1 mx-4">
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%`, background: "var(--primary)" }}
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="badge text-[10px] font-bold px-2 py-0.5"
            style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
            Mức {currentWord.srLevel}
          </span>
          <span className="text-xs font-extrabold font-mono" style={{ color: "var(--primary)" }}>
            {currentIndex + 1} / {dueWords.length}
          </span>
        </div>
      </div>

      {/* QUESTION CARD */}
      <div className="card p-6 sm:p-8 rounded-3xl border text-center shadow-md mb-4 animate-fade-up relative"
        style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>

        <div className="text-[11px] font-bold uppercase tracking-widest mb-3" style={{ color: "var(--text-muted)" }}>
          {stepLabel[currentStep]}
        </div>

        {/* Question Type: meaning-to-word */}
        {currentStep === "meaning-to-word" && (
          <div>
            <h3 className="text-2xl sm:text-3xl font-black mb-2" style={{ color: "var(--text)" }}>
              {currentWord.meaning}
            </h3>
            {currentWord.type && (
              <span className="text-xs font-semibold italic px-2 py-0.5 rounded-md" style={{ background: "var(--surface-2)", color: "var(--text-muted)" }}>
                {currentWord.type}
              </span>
            )}
          </div>
        )}

        {/* Question Type: word-to-meaning */}
        {currentStep === "word-to-meaning" && (
          <div>
            <h3 className="text-3xl sm:text-4xl font-black mb-1.5" style={{ color: "var(--text)" }}>
              {currentWord.word}
            </h3>
            {ipa && (
              <div className="text-sm font-ipa font-medium mb-3" style={{ color: "var(--primary)" }}>
                {ipa.startsWith("/") ? ipa : `/${ipa}/`}
              </div>
            )}
            <div className="flex justify-center">
              <SpeakButton text={currentWord.word} audioUrl={currentWord.audioUrl} size="sm" />
            </div>
          </div>
        )}

        {/* Question Type: listening */}
        {currentStep === "listening" && (
          <div className="flex flex-col items-center gap-3 py-2">
            <SpeakButton text={currentWord.word} audioUrl={currentWord.audioUrl} size="lg" />
            <p className="text-xs font-semibold" style={{ color: "var(--text-muted)" }}>
              Bấm để nghe phát âm từ vựng
            </p>
          </div>
        )}

        {/* Question Type: type-spelling */}
        {currentStep === "type-spelling" && (
          <div className="flex flex-col items-center gap-3">
            <h3 className="text-2xl font-black" style={{ color: "var(--text)" }}>
              {currentWord.meaning}
            </h3>
            {ipa && (
              <div className="text-xs font-ipa font-medium" style={{ color: "var(--primary)" }}>
                Phiên âm: {ipa}
              </div>
            )}
            <input
              ref={inputRef}
              type="text"
              autoFocus
              disabled={isChecked}
              value={typedAnswer}
              onChange={(e) => setTypedAnswer(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" && !isChecked && typedAnswer.trim()) handleCheckAnswer(); }}
              placeholder="Gõ chính tả từ tiếng Anh..."
              className="input text-center font-bold text-lg py-3 rounded-2xl w-full max-w-sm border"
              style={{ background: "var(--surface-2)", borderColor: "var(--border-strong)", color: "var(--text)" }}
            />
          </div>
        )}
      </div>

      {/* MULTIPLE CHOICES (For choice questions) */}
      {currentStep !== "type-spelling" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4 animate-fade-up">
          {choices.map((choice, i) => {
            const isSelected = selectedChoice === choice;
            let btnStyle: React.CSSProperties = {
              background: "var(--surface)",
              borderColor: "var(--border-strong)",
              color: "var(--text)",
            };

            if (!isChecked) {
              if (isSelected) {
                btnStyle = {
                  background: "var(--primary-glow)",
                  borderColor: "var(--primary)",
                  boxShadow: "0 0 0 2px var(--primary)",
                  color: "var(--text)",
                };
              }
            } else {
              const correct = currentStep === "meaning-to-word" ? cleanStr(currentWord.word) : currentWord.meaning.trim();
              if (choice === correct) {
                btnStyle = { background: "rgba(34,197,94,0.15)", borderColor: "#16a34a", color: "#16a34a" };
              } else if (isSelected && choice !== correct) {
                btnStyle = { background: "rgba(239,68,68,0.15)", borderColor: "#ef4444", color: "#ef4444" };
              } else {
                btnStyle = { opacity: 0.35, background: "var(--surface)" };
              }
            }

            return (
              <button
                key={i}
                onClick={() => handleSelectChoice(choice)}
                disabled={isChecked}
                className="p-4 rounded-2xl border text-left font-extrabold text-sm sm:text-base transition-all active:scale-95 flex items-center justify-between shadow-sm"
                style={btnStyle}
              >
                <span>{choice}</span>
                <span className="text-xs font-mono opacity-40">{i + 1}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* BOTTOM ACTION BAR */}
      <div className="mt-4">
        {!isChecked ? (
          <button
            onClick={handleCheckAnswer}
            disabled={currentStep === "type-spelling" ? !typedAnswer.trim() : !selectedChoice}
            className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
            style={{ background: "var(--primary)" }}
          >
            Kiểm tra
          </button>
        ) : (
          <div className="flex flex-col gap-2 animate-fade-in">
            {answerStatus === "wrong" && (
              <div className="p-3 rounded-2xl border flex items-center justify-between text-xs font-bold"
                style={{ background: "rgba(239,68,68,0.1)", borderColor: "#ef4444", color: "#ef4444" }}>
                <span>Đáp án đúng: <span className="font-extrabold text-sm">{currentStep === "meaning-to-word" ? currentWord.word : currentWord.meaning}</span></span>
                {ipa && <span className="font-mono text-xs">{ipa}</span>}
              </div>
            )}

            <button
              onClick={() => handleResult(answerStatus === "correct")}
              className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              style={{ background: answerStatus === "correct" ? "#16a34a" : "#ea580c" }}
            >
              {answerStatus === "correct" ? "Chính xác! Tiếp tục" : "Đã hiểu — Tiếp tục"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Exit Confirmation Modal */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 rounded-3xl max-w-sm w-full border text-center shadow-2xl animate-scale-in"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
            <h3 className="text-xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Tạm dừng phiên ôn tập?</h3>
            <p className="text-xs font-medium mb-6" style={{ color: "var(--text-muted)" }}>
              Các từ bạn đã ôn xong sẽ được lưu vào hệ thống Spaced Repetition.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm border hover:bg-[var(--surface-2)]"
                style={{ borderColor: "var(--border-color)", color: "var(--text)" }}
              >
                Ôn tiếp
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white"
                style={{ background: "#ef4444" }}
              >
                Thoát
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}