"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { auth } from "@/lib/firebase";
import { markNewWordLearned, updateProgress, masterWordDirectly } from "@/lib/progress";
import { playAudioOrSpeak, speakEnglish } from "@/lib/speech";
import SpeakButton from "@/components/ui/SpeakButton";
import Link from "next/link";
import { sfx } from "@/lib/sfx";
import SessionCompletionModal from "@/components/ui/SessionCompletionModal";
import { Volume2, Sparkles, Check, CheckCircle2, RotateCw, ArrowRight } from "lucide-react";

type Vocabulary = {
  id: string;
  word: string;
  reading?: string;
  ipa?: string;
  type?: string;
  meaning: string;
  example?: string;
  exampleMeaning?: string;
  audioUrl?: string;
  imageUrl?: string;
  level: string;
  status?: string;
  courseId?: string;
  courseName?: string;
  lessonId?: string;
  lessonTitle?: string;
};

type Step =
  | "flashcard"
  | "meaning-to-word"
  | "listening"
  | "result";

function generateChoices(
  correct: Vocabulary,
  allWords: Vocabulary[],
  type: "word" | "meaning"
): string[] {
  const others = allWords
    .filter((w) => w.id !== correct.id)
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
  const choices =
    type === "word"
      ? [correct.word, ...others.map((w) => w.word)]
      : [correct.meaning, ...others.map((w) => w.meaning)];
  return choices.sort(() => Math.random() - 0.5);
}

interface StudySessionProps {
  words: Vocabulary[];
  courseId: string;
  learnedWordIds?: Set<string>;
  isRandomOrder?: boolean;
  totalWordsInLesson?: number;
}

export default function StudySession({
  words,
  courseId,
  learnedWordIds = new Set(),
  isRandomOrder = false,
  totalWordsInLesson,
}: StudySessionProps) {
  const [sessionWords, setSessionWords] = useState<Vocabulary[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentStep, setCurrentStep] = useState<Step>("flashcard");
  const [isFlipped, setIsFlipped] = useState(false);
  const [choices, setChoices] = useState<string[]>([]);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [answerStatus, setAnswerStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [isChecked, setIsChecked] = useState(false);
  const [learnedCount, setLearnedCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const canAdvanceRef = useRef<number>(0);

  // ===== TRẠNG THÁI TỔNG KẾT SAU BÀI HỌC =====
  const [showSummary, setShowSummary] = useState(false);
  const [completedWords, setCompletedWords] = useState<Vocabulary[]>([]);
  const [skippedWordIds, setSkippedWordIds] = useState<Set<string>>(new Set());
  const [wordReviewChoices, setWordReviewChoices] = useState<Record<string, boolean>>({});
  const [isSavingSummary, setIsSavingSummary] = useState(false);
  const [summaryResult, setSummaryResult] = useState<{ toReview: number; toMaster: number }>({ toReview: 0, toMaster: 0 });

  useEffect(() => {
    if (words.length === 0) return;
    const newWords = words.filter((w) => !learnedWordIds.has(w.id));
    const ordered = isRandomOrder
      ? [...newWords].sort(() => Math.random() - 0.5)
      : newWords;
    setSessionWords(ordered);
    setLoading(false);
    setCurrentIndex(0);
    setCurrentStep("flashcard");
    setIsFlipped(false);
    setSelectedAnswer(null);
    setAnswerStatus("idle");
    setLearnedCount(0);
  }, [words, learnedWordIds, isRandomOrder]);

  useEffect(() => {
    if (sessionWords.length === 0) return;
    const current = sessionWords[currentIndex];
    if (current) {
      const timer = window.setTimeout(() => playAudioOrSpeak(current.word, current.audioUrl, false), 400);
      return () => window.clearTimeout(timer);
    }
  }, [currentIndex, sessionWords]);

  useEffect(() => {
    if (!showSummary) return;
    const initialChoices: Record<string, boolean> = {};
    completedWords.forEach((w) => {
      initialChoices[w.id] = !skippedWordIds.has(w.id);
    });
    setWordReviewChoices(initialChoices);
  }, [showSummary, completedWords, skippedWordIds]);

  const currentWord = sessionWords[currentIndex];

  const prepareChoices = useCallback(
    (step: Step, word: Vocabulary) => {
      if (step === "meaning-to-word") {
        setChoices(generateChoices(word, sessionWords, "word"));
      } else if (step === "listening") {
        setChoices(generateChoices(word, sessionWords, "meaning"));
      }
      setSelectedChoice(null);
      setSelectedAnswer(null);
      setAnswerStatus("idle");
      setIsChecked(false);
    },
    [sessionWords]
  );

  const getNextStep = (current: Step): Step | "done" => {
    if (current === "flashcard") return "meaning-to-word";
    if (current === "meaning-to-word") return "listening";
    return "done";
  };

  const goNextWord = async () => {
    const user = auth.currentUser;
    if (user && currentWord) {
      await markNewWordLearned(user.uid, currentWord.id);
      await updateProgress(user.uid, 1, {
        displayName: user.displayName || "",
        email: user.email || "",
      });
    }
    setLearnedCount((prev) => prev + 1);

    if (currentWord) {
      setCompletedWords((prev) => {
        if (prev.find((w) => w.id === currentWord.id)) return prev;
        return [...prev, currentWord];
      });
    }

    if (currentIndex + 1 >= sessionWords.length) {
      setShowSummary(true);
      return;
    }

    const nextIndex = currentIndex + 1;
    setCurrentIndex(nextIndex);
    setCurrentStep("flashcard");
    setIsFlipped(false);
    setSelectedChoice(null);
    setSelectedAnswer(null);
    setAnswerStatus("idle");
    setIsChecked(false);
    const nextWord = sessionWords[nextIndex];
    setTimeout(() => playAudioOrSpeak(nextWord.word, nextWord.audioUrl, false), 300);
  };

  const nextStep = async () => {
    if (!currentWord) return;
    const next = getNextStep(currentStep);
    if (next === "done") {
      await goNextWord();
    } else {
      setCurrentStep(next);
      prepareChoices(next, currentWord);
      setIsFlipped(false);
      if (next === "listening") setTimeout(() => playAudioOrSpeak(currentWord.word, currentWord.audioUrl, false), 300);
    }
  };

  // Phím tắt
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (loading || currentIndex >= sessionWords.length || currentStep === "result") return;

      if (e.key === "Enter" || e.key === " ") {
        if ((e.target as HTMLElement).tagName === "INPUT" || (e.target as HTMLElement).tagName === "TEXTAREA") return;
        e.preventDefault();

        if (currentStep === "flashcard") {
          if (!isFlipped) setIsFlipped(true);
          else nextStep();
          return;
        }

        if (!isChecked) {
          if (selectedChoice) handleCheckAnswer();
        } else {
          if (Date.now() >= canAdvanceRef.current) nextStep();
        }
        return;
      }

      if (
        !isChecked &&
        ["1", "2", "3", "4"].includes(e.key) &&
        (currentStep === "meaning-to-word" || currentStep === "listening")
      ) {
        e.preventDefault();
        const idx = parseInt(e.key) - 1;
        if (choices[idx]) handleSelectChoice(choices[idx]);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [loading, currentIndex, sessionWords, currentStep, isFlipped, isChecked, selectedChoice, choices]);

  const handleSkipWord = async () => {
    if (currentWord) {
      setSkippedWordIds((prev) => new Set(Array.from(prev).concat(currentWord.id)));
    }
    await goNextWord();
  };

  const handleSelectChoice = (choice: string) => {
    if (isChecked) return;
    setSelectedChoice(choice);
  };

  const handleCheckAnswer = () => {
    if (isChecked || !selectedChoice || !currentWord) return;
    const correct = currentStep === "meaning-to-word" ? currentWord.word : currentWord.meaning;
    const isRight = selectedChoice === correct;
    setSelectedAnswer(selectedChoice);
    setAnswerStatus(isRight ? "correct" : "wrong");
    setIsChecked(true);
    canAdvanceRef.current = Date.now() + 350;
    if (isRight) sfx.playCorrect();
    else sfx.playWrong();
  };

  const getChoiceStyle = (choice: string): React.CSSProperties => {
    if (!currentWord) return {};
    const correct = currentStep === "meaning-to-word" ? currentWord.word : currentWord.meaning;
    if (!isChecked) {
      if (choice === selectedChoice) return { borderColor: "var(--primary)", boxShadow: "0 0 0 2px var(--primary)", background: "var(--primary-glow)" };
      return {};
    }
    if (choice === correct) return { background: "rgba(34, 197, 94, 0.15)", color: "var(--text)", borderColor: "var(--primary)" };
    if (choice === selectedAnswer && choice !== correct) return { background: "rgba(239, 68, 68, 0.15)", color: "var(--text)", borderColor: "#ef4444" };
    return { opacity: 0.35 };
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
          <p className="text-sm font-medium" style={{ color: "var(--text-muted)" }}>Đang chuẩn bị bài học...</p>
        </div>
      </div>
    );
  }

  const alreadyLearnedCount = learnedWordIds.size;
  const total = totalWordsInLesson ?? words.length;

  if (!loading && sessionWords.length === 0 && words.length > 0) {
    return (
      <SessionCompletionModal
        title="Bài học đã hoàn thành!"
        totalWords={alreadyLearnedCount || total}
        nextLessonUrl={`/learn/${encodeURIComponent(courseId)}`}
        onRestart={() => window.location.reload()}
      />
    );
  }

  if (!currentWord) {
    return (
      <div className="card p-10 text-center rounded-3xl">
        <div className="text-2xl font-bold mb-3">Không tìm thấy bài học</div>
        <p className="text-sm mb-5" style={{ color: "var(--text-muted)" }}>
          Bài học này chưa có từ vựng. Hãy kiểm tra lại hoặc chọn bài khác.
        </p>
        <div className="flex flex-col gap-3">
          <Link href={`/learn/${encodeURIComponent(courseId)}`} className="btn py-3 rounded-2xl text-white font-bold" style={{ background: "var(--primary)" }}>← Quay lại bài học</Link>
        </div>
      </div>
    );
  }

  // XÁC NHẬN TỔNG KẾT
  const handleConfirmSummary = async () => {
    const user = auth.currentUser;
    if (!user || isSavingSummary) return;
    setIsSavingSummary(true);

    let toReview = 0;
    let toMaster = 0;

    try {
      await Promise.all(
        completedWords.map(async (word) => {
          const wantsReview = wordReviewChoices[word.id] !== false;
          if (wantsReview) {
            toReview++;
          } else {
            await masterWordDirectly(user.uid, word.id);
            toMaster++;
          }
        })
      );
      setSummaryResult({ toReview, toMaster });
      setShowSummary(false);
      setCurrentStep("result");
    } catch (err) {
      console.error("Lỗi lưu tổng kết:", err);
    } finally {
      setIsSavingSummary(false);
    }
  };

  // MÀN HÌNH TỔNG KẾT
  if (showSummary) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-6 animate-fade-up">
        <div className="card p-6 sm:p-8 rounded-3xl border text-center shadow-lg"
          style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
          <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center text-3xl mb-4"
            style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
            🎉
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold" style={{ color: "var(--text)" }}>
            Hoàn thành bài học!
          </h2>
          <p className="text-sm font-medium mt-1 mb-6" style={{ color: "var(--text-muted)" }}>
            Bạn vừa học xong <span className="font-bold text-[var(--primary)]">{completedWords.length}</span> từ vựng mới. Chọn từ bạn muốn đưa vào lịch ôn tập Spaced Repetition:
          </p>

          <div className="space-y-2.5 max-h-[50vh] overflow-y-auto pr-1 text-left mb-6">
            {completedWords.map((word) => {
              const isCheckedItem = wordReviewChoices[word.id] !== false;
              const ipa = word.reading || word.ipa;
              return (
                <div
                  key={word.id}
                  onClick={() => setWordReviewChoices((prev) => ({ ...prev, [word.id]: !isCheckedItem }))}
                  className="flex items-center justify-between p-3.5 rounded-2xl border cursor-pointer transition-all hover:bg-[var(--surface-2)]"
                  style={{
                    background: isCheckedItem ? "var(--primary-glow)" : "var(--surface)",
                    borderColor: isCheckedItem ? "var(--primary)" : "var(--border-color)"
                  }}
                >
                  <div className="flex-1 min-w-0 pr-3">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-base" style={{ color: "var(--text)" }}>{word.word}</span>
                      {ipa && <span className="text-xs font-mono" style={{ color: "var(--primary)" }}>{ipa}</span>}
                    </div>
                    <div className="text-xs truncate mt-0.5" style={{ color: "var(--text-muted)" }}>{word.meaning}</div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[11px] font-bold" style={{ color: isCheckedItem ? "var(--primary)" : "var(--text-faint)" }}>
                      {isCheckedItem ? "Ôn tập (SRS)" : "Đã thuộc"}
                    </span>
                    <div className={`w-5 h-5 rounded-lg flex items-center justify-center border transition-colors ${isCheckedItem ? "bg-[var(--primary)] text-white border-[var(--primary)]" : "border-[var(--border-strong)]"}`}>
                      {isCheckedItem && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            onClick={handleConfirmSummary}
            disabled={isSavingSummary}
            className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
            style={{ background: "var(--primary)" }}
          >
            {isSavingSummary ? "Đang lưu..." : "Xác nhận & Hoàn tất"} <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // MÀN HÌNH RESULT CUỐI CÙNG
  if (currentStep === "result") {
    return (
      <SessionCompletionModal
        title="Xuất sắc! Đã lưu tiến trình"
        totalWords={completedWords.length}
        nextLessonUrl={`/learn/${encodeURIComponent(courseId)}`}
        onRestart={() => window.location.reload()}
      />
    );
  }

  const currentIpa = currentWord.reading || currentWord.ipa;
  const progressPercent = ((currentIndex) / sessionWords.length) * 100;

  return (
    <div className="max-w-xl mx-auto px-4 py-4 select-none">
      {/* Top Header & Progress */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setShowExitModal(true)}
          className="text-sm font-bold px-3 py-1.5 rounded-xl border hover:bg-[var(--surface-2)] transition-colors"
          style={{ borderColor: "var(--border-color)", color: "var(--text-muted)" }}
        >
          ✕ Thoát
        </button>

        <div className="flex-1 mx-4">
          <div className="h-2 w-full rounded-full overflow-hidden" style={{ background: "var(--surface-3)" }}>
            <div
              className="h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%`, background: "var(--primary)" }}
            />
          </div>
        </div>

        <span className="text-xs font-extrabold font-mono" style={{ color: "var(--primary)" }}>
          {currentIndex + 1} / {sessionWords.length}
        </span>
      </div>

      {/* STEP 1: FLASHCARD */}
      {currentStep === "flashcard" && (
        <div className="animate-fade-up">
          <div
            onClick={() => setIsFlipped(!isFlipped)}
            className="min-h-[280px] sm:min-h-[320px] rounded-3xl p-6 sm:p-8 flex flex-col justify-between items-center text-center cursor-pointer border shadow-md transition-all hover:shadow-lg relative"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}
          >
            <div className="w-full flex justify-between items-center">
              <span className="text-[11px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full"
                style={{ background: "var(--primary-glow)", color: "var(--primary)" }}>
                {currentWord.level || "Vocabulary"}
              </span>
              {currentWord.type && (
                <span className="text-xs font-semibold italic" style={{ color: "var(--text-muted)" }}>
                  {currentWord.type}
                </span>
              )}
            </div>

            {/* Front & Back Content */}
            <div className="my-auto py-4">
              <h2 className="text-4xl sm:text-5xl font-black tracking-tight mb-2" style={{ color: "var(--text)" }}>
                {currentWord.word}
              </h2>

              {currentIpa && (
                <div className="text-base sm:text-lg font-ipa font-medium mb-3" style={{ color: "var(--primary)" }}>
                  {currentIpa.startsWith("/") ? currentIpa : `/${currentIpa}/`}
                </div>
              )}

              {isFlipped ? (
                <div className="animate-fade-in pt-3 border-t max-w-sm mx-auto" style={{ borderColor: "var(--border-color)" }}>
                  <div className="text-xl sm:text-2xl font-extrabold mb-3" style={{ color: "var(--text)" }}>
                    {currentWord.meaning}
                  </div>
                  {currentWord.example && (
                    <div className="text-xs font-medium rounded-xl p-3 border text-left"
                      style={{ background: "var(--surface-2)", borderColor: "var(--border-color)", color: "var(--text-muted)" }}>
                      <div className="font-semibold text-sm" style={{ color: "var(--text)" }}>
                        &ldquo;{currentWord.example}&rdquo;
                      </div>
                      {currentWord.exampleMeaning && (
                        <div className="mt-1 text-xs">{currentWord.exampleMeaning}</div>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-xs font-semibold animate-pulse mt-4 flex items-center justify-center gap-1" style={{ color: "var(--text-faint)" }}>
                  <RotateCw className="w-3.5 h-3.5" /> Chạm để lật thẻ
                </div>
              )}
            </div>

            {/* Audio Button */}
            <div className="w-full flex justify-between items-center pt-2">
              <SpeakButton text={currentWord.word} audioUrl={currentWord.audioUrl} size="md" />
              <button
                onClick={(e) => { e.stopPropagation(); handleSkipWord(); }}
                className="text-xs font-bold px-3 py-1.5 rounded-xl transition-colors hover:bg-[var(--surface-2)]"
                style={{ color: "var(--text-muted)" }}
              >
                Đã biết từ này →
              </button>
            </div>
          </div>

          {/* Action Button */}
          <div className="mt-4">
            <button
              onClick={() => {
                if (!isFlipped) setIsFlipped(true);
                else nextStep();
              }}
              className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
              style={{ background: "var(--primary)" }}
            >
              {!isFlipped ? "Xem nghĩa & ví dụ" : "Tiếp tục kiểm tra"} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: MEANING TO WORD (Quiz) */}
      {currentStep === "meaning-to-word" && (
        <div className="animate-fade-up">
          <div className="card p-6 sm:p-8 rounded-3xl border text-center shadow-md mb-4"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Chọn từ tiếng Anh có nghĩa:
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold mt-3 mb-1" style={{ color: "var(--text)" }}>
              {currentWord.meaning}
            </h3>
            {currentWord.type && (
              <span className="text-xs italic font-medium" style={{ color: "var(--primary)" }}>
                ({currentWord.type})
              </span>
            )}
          </div>

          {/* Choices */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleSelectChoice(choice)}
                disabled={isChecked}
                className="p-4 rounded-2xl border text-left font-extrabold text-base transition-all active:scale-95 flex items-center justify-between"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-strong)",
                  color: "var(--text)",
                  ...getChoiceStyle(choice),
                }}
              >
                <span>{choice}</span>
                <span className="text-xs font-mono opacity-50">{i + 1}</span>
              </button>
            ))}
          </div>

          {/* Check / Next */}
          <div className="mt-5">
            {!isChecked ? (
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedChoice}
                className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                style={{ background: answerStatus === "correct" ? "#16a34a" : "#ea580c" }}
              >
                {answerStatus === "correct" ? "Chính xác! Tiếp tục" : "Tiếp tục"} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* STEP 3: LISTENING QUIZ */}
      {currentStep === "listening" && (
        <div className="animate-fade-up">
          <div className="card p-6 sm:p-8 rounded-3xl border text-center shadow-md mb-4 flex flex-col items-center gap-4"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
            <span className="text-xs font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>
              Nghe phát âm và chọn nghĩa đúng:
            </span>

            <SpeakButton text={currentWord.word} audioUrl={currentWord.audioUrl} size="lg" />

            <span className="text-xs font-medium" style={{ color: "var(--text-muted)" }}>
              Bấm loa để nghe lại
            </span>
          </div>

          {/* Choices */}
          <div className="grid grid-cols-1 gap-2.5">
            {choices.map((choice, i) => (
              <button
                key={i}
                onClick={() => handleSelectChoice(choice)}
                disabled={isChecked}
                className="p-4 rounded-2xl border text-left font-bold text-sm sm:text-base transition-all active:scale-95 flex items-center justify-between"
                style={{
                  background: "var(--surface)",
                  borderColor: "var(--border-strong)",
                  color: "var(--text)",
                  ...getChoiceStyle(choice),
                }}
              >
                <span>{choice}</span>
                <span className="text-xs font-mono opacity-50">{i + 1}</span>
              </button>
            ))}
          </div>

          {/* Check / Next */}
          <div className="mt-5">
            {!isChecked ? (
              <button
                onClick={handleCheckAnswer}
                disabled={!selectedChoice}
                className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 disabled:opacity-50"
                style={{ background: "var(--primary)" }}
              >
                Kiểm tra
              </button>
            ) : (
              <button
                onClick={nextStep}
                className="w-full py-4 rounded-2xl font-extrabold text-base text-white shadow-md transition-transform active:scale-95 flex items-center justify-center gap-2"
                style={{ background: answerStatus === "correct" ? "#16a34a" : "#ea580c" }}
              >
                {answerStatus === "correct" ? "Chính xác! Tiếp tục" : "Tiếp tục"} <ArrowRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Exit Modal Confirmation */}
      {showExitModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card p-6 rounded-3xl max-w-sm w-full border text-center shadow-2xl animate-scale-in"
            style={{ background: "var(--surface)", borderColor: "var(--border-color)" }}>
            <h3 className="text-xl font-extrabold mb-2" style={{ color: "var(--text)" }}>Dừng buổi học?</h3>
            <p className="text-xs font-medium mb-6" style={{ color: "var(--text-muted)" }}>
              Tiến trình của các từ đã hoàn thành sẽ được lưu lại.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowExitModal(false)}
                className="flex-1 py-3 rounded-xl font-bold text-sm border hover:bg-[var(--surface-2)]"
                style={{ borderColor: "var(--border-color)", color: "var(--text)" }}
              >
                Học tiếp
              </button>
              <Link
                href={`/learn/${encodeURIComponent(courseId)}`}
                className="flex-1 py-3 rounded-xl font-bold text-sm text-white flex items-center justify-center"
                style={{ background: "#ef4444" }}
              >
                Thoát
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
