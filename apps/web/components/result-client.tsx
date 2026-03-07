"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Card, Button, Divider } from "./ui";
import { api } from "../lib/api";
import { CheckCircle2 } from "lucide-react";

type AttemptDetail = {
  participantName: string;
  score: number;
  submittedAt: string | null;
  questions: {
    number: number;
    type: "MCQ" | "SENTENCE";
    prompt: string;
    options?: string[];
    correctIndex?: number;
    selectedIndex?: number | null;
    isCorrect?: boolean | null;
  }[];
};

export function ResultClient({ attemptId }: { attemptId: string }) {
  const [attempt, setAttempt] = useState<AttemptDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    (async () => {
      try {
        const data = await api<{ ok: true; attempt: AttemptDetail }>(
          `/api/attempts/${attemptId}/detail`
        );
        if (!mounted) return;
        setAttempt(data.attempt);
      } catch (e: any) {
        alert(e.message);
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [attemptId]);

  if (loading) return <div className="text-white/60">Loading result...</div>;
  if (!attempt) return <div className="text-white/60">Result not found.</div>;

  const totalMarks = attempt.questions.length;

  return (
    <Card>
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-neon-500/10 p-3 text-neon-500">
          <CheckCircle2 size={20} />
        </div>
        <div>
          <div className="text-lg font-semibold">Test Completed</div>
          <div className="text-sm text-white/60">
            Submitted at{" "}
            {attempt.submittedAt
              ? new Date(attempt.submittedAt).toLocaleString()
              : "-"}
          </div>
        </div>
      </div>

      <Divider />

      {/* Score */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
        <div className="text-sm text-white/60">Final Score</div>
        <div className="mt-1 text-3xl font-semibold text-neon-500">
          {attempt.score}
          <span className="text-white/40 text-lg"> / {totalMarks}</span>
        </div>
      </div>

      <Divider />

      {/* Question Review */}
      <div className="space-y-4">
        {attempt.questions.map((q) => (
          <div
            key={q.number}
            className={`rounded-2xl border p-4 ${
              q.isCorrect === true
                ? "border-green-500/40 bg-green-500/10"
                : q.isCorrect === false
                ? "border-red-500/40 bg-red-500/10"
                : "border-white/10 bg-white/5"
            }`}
          >
            <div className="text-sm font-medium">
              Q{q.number}. {q.prompt}
            </div>

            {/* MCQ OPTIONS */}
            {q.type === "MCQ" && q.options && (
              <div className="mt-3 space-y-2 text-sm">
                {q.options.map((opt, oi) => {
                  const attempted =
                    q.selectedIndex !== null &&
                    q.selectedIndex !== undefined;

                  let style = "border-white/10";

                  // Correct answer (only if attempted)
                  if (attempted && oi === q.correctIndex)
                    style = "border-green-500 bg-green-500/10";

                  // Wrong selected option
                  if (
                    attempted &&
                    oi === q.selectedIndex &&
                    oi !== q.correctIndex
                  )
                    style = "border-red-500 bg-red-500/10";

                  return (
                    <div key={oi} className={`rounded-xl px-3 py-2 border ${style}`}>
                      {opt}
                    </div>
                  );
                })}
              </div>
            )}

            {/* STATUS LABEL */}
            <div className="mt-3 text-sm font-semibold">
              {q.isCorrect === true && (
                <span className="text-green-400">✔ Correct</span>
              )}
              {q.isCorrect === false && (
                <span className="text-red-400">✘ Wrong</span>
              )}
              {q.isCorrect === null && (
                <span className="text-gray-400">• Not Attempted</span>
              )}
            </div>
          </div>
        ))}
      </div>

      <Divider />

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Link href="/" className="w-full sm:w-auto">
          <Button variant="ghost" className="w-full">
            Back Home
          </Button>
        </Link>
        <Link href="/join" className="w-full sm:w-auto">
          <Button className="w-full">Join Another Test</Button>
        </Link>
      </div>
    </Card>
  );
}
