"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "../lib/api";
import { Button, Card, Divider, Input, Label, Textarea } from "./ui";
import { useRouter } from "next/navigation";

type ServedQuestion = {
  number: number;
  type: "MCQ" | "SENTENCE";
  prompt: string;
  options?: string[];
  correctIndex?: number;
  selectedIndex?: number | null;
  isCorrect?: boolean | null;
};

type AttemptDetail = {
  participantName: string;
  questionPaperType?: string;
  score: number;
  submittedAt: string | null;
  questions: ServedQuestion[];
};

export function TestClient({ slug }: { slug: string }) {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [participantName, setParticipantName] = useState("");
  const [participantEmail, setParticipantEmail] = useState("");

  const [attemptId, setAttemptId] = useState<string | null>(null);
  const [servedQuestions, setServedQuestions] = useState<ServedQuestion[]>([]);
  const [answers, setAnswers] = useState<any[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [questionPaperType, setQuestionPaperType] = useState<string>("");

  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!attemptId || secondsLeft === null || isSubmitting || hasSubmitted) return;

    const t = setInterval(() => {
      setSecondsLeft((s) => {
        if (s === null) return null;
        return s > 0 ? s - 1 : 0;
      });
    }, 1000);

    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, isSubmitting, hasSubmitted]);

  useEffect(() => {
    if (!attemptId || secondsLeft !== 0 || isSubmitting || hasSubmitted) return;
    submit(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attemptId, secondsLeft, isSubmitting, hasSubmitted]);

  const timeLabel = useMemo(() => {
    if (secondsLeft === null) return "--:--";
    const m = Math.floor(secondsLeft / 60);
    const s = secondsLeft % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }, [secondsLeft]);

  async function start() {
    if (!participantName.trim()) return alert("Enter your name");

    try {
      const startRes = await api<{
        ok: true;
        attemptId: string;
        attempt: AttemptDetail & { durationMinutes?: number };
      }>(`/api/attempts/${slug}/start`, {
        method: "POST",
        body: JSON.stringify({
          participantName,
          participantEmail,
        }),
      });

      setAttemptId(startRes.attemptId);
      setServedQuestions(startRes.attempt.questions);
      setQuestionPaperType(startRes.attempt.questionPaperType || "");

      setAnswers(
        startRes.attempt.questions.map((_, idx) => ({
          questionIndex: idx,
          mcqIndex: null,
          sentenceText: "",
        }))
      );

      setSecondsLeft((startRes.attempt.durationMinutes || 10) * 60);
      setCurrentIndex(0);
      setIsSubmitting(false);
      setHasSubmitted(false);
      setLoading(false);
    } catch (e: any) {
      alert(e.message);
    }
  }

  function setMcq(qIndex: number, mcqIndex: number) {
    setAnswers((prev) =>
      prev.map((a) => (a.questionIndex === qIndex ? { ...a, mcqIndex } : a))
    );
  }

  function setSentence(qIndex: number, sentenceText: string) {
    setAnswers((prev) =>
      prev.map((a) =>
        a.questionIndex === qIndex ? { ...a, sentenceText } : a
      )
    );
  }

  async function submit(auto = false) {
    if (!attemptId || isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);
    try {
      await api<{ ok: true; score: number; totalMarks: number }>(
        `/api/attempts/${attemptId}/submit`,
        {
          method: "POST",
          body: JSON.stringify({ answers }),
        }
      );

      setHasSubmitted(true);
      router.push(`/result/${attemptId}`);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (!attemptId) {
    return (
      <Card>
        <div className="text-lg font-semibold">Start Test</div>
        <Divider />

        <Label>Your name</Label>
        <Input
          className="mt-2"
          value={participantName}
          onChange={(e) => setParticipantName(e.target.value)}
        />

        <Label className="mt-4 block">Email (optional)</Label>
        <Input
          className="mt-2"
          value={participantEmail}
          onChange={(e) => setParticipantEmail(e.target.value)}
        />

        <div className="mt-5">
          <Button onClick={start}>Start Test</Button>
        </div>
      </Card>
    );
  }

  if (loading || servedQuestions.length === 0) {
    return <div className="text-white/60">Loading questions...</div>;
  }

  const q = servedQuestions[currentIndex];

  return (
    <Card>
      <div className="flex justify-between items-start">
        <div className="text-sm text-white/60">
          Question {currentIndex + 1} of {servedQuestions.length}
        </div>

        <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-2">
          <div className="text-xs text-white/60">Time left</div>
          <div className="text-lg font-semibold text-neon-500">{timeLabel}</div>
        </div>
      </div>

      <Divider />

      <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
        {questionPaperType ? (
          <div className="text-xs text-neon-500 mb-2">
            Question Paper: {questionPaperType}
          </div>
        ) : null}
        <div className="text-xs text-white/60">
          Q{q.number} - {q.type}
        </div>

        <div className="mt-2 text-base font-medium whitespace-pre-wrap">
          {q.prompt}
        </div>

        {q.type === "MCQ" && q.options ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.options.map((opt, oi) => (
              <button
                key={oi}
                onClick={() => setMcq(currentIndex, oi)}
                className={`rounded-2xl border px-4 py-3 text-left text-sm transition ${
                  answers[currentIndex]?.mcqIndex === oi
                    ? "border-neon-500/60 bg-neon-500/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
              >
                {opt}
              </button>
            ))}
          </div>
        ) : (
          <div className="mt-4">
            <Textarea
              rows={6}
              value={answers[currentIndex]?.sentenceText || ""}
              onChange={(e) => setSentence(currentIndex, e.target.value)}
              placeholder="Write your answer..."
            />
          </div>
        )}
      </div>

      <div className="flex justify-between mt-5">
        <Button
          variant="ghost"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((i) => i - 1)}
        >
          Previous
        </Button>

        {currentIndex === servedQuestions.length - 1 ? (
          <Button onClick={() => submit(false)} disabled={isSubmitting}>
            {isSubmitting ? "Submitting..." : "Submit"}
          </Button>
        ) : (
          <Button onClick={() => setCurrentIndex((i) => i + 1)}>Next</Button>
        )}
      </div>
    </Card>
  );
}
