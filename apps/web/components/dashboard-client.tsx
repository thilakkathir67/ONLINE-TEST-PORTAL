"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { clearToken, getToken } from "../lib/auth";
import { Button, Card, Divider } from "./ui";
import { useRouter } from "next/navigation";
import { Copy, Check } from "lucide-react";

type Participant = {
  id: string;
  name: string;
  email: string;
  score: number;
  submittedAt: string;
  paperType: string;
};

type Analytics = {
  participants: Participant[];
  paperTypeStats: {
    paperType: string;
    totalParticipants: number;
    participants: Participant[];
  }[];
  averageScore: number;
};

type QuestionPaper = {
  paperType: string;
  totalQuestions: number;
  questions: {
    number: number;
    type: string;
    prompt: string;
    options: string[];
    marks: number;
    correctIndex: number | null;
  }[];
};

type MyTest = {
  _id: string;
  name: string;
  slug: string;
  createdAt: string;
  durationMinutes: number;
  totalMarks: number;
  questionType: "MCQ" | "SENTENCE" | "MIXED";
  questionPaperCount?: number;
};

type AttemptDetail = {
  participantName: string;
  questionPaperType?: string;
  score: number;
  submittedAt: string;
  questions: {
    prompt: string;
    options?: string[];
    correctIndex?: number;
    selectedIndex?: number | null;
    isCorrect?: boolean | null;
  }[];
};

export function DashboardClient() {
  const router = useRouter();

  const [tests, setTests] = useState<MyTest[]>([]);
  const [selectedSlug, setSelectedSlug] = useState<string>("");

  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [questionPapers, setQuestionPapers] = useState<QuestionPaper[]>([]);
  const [selectedQuestionPaper, setSelectedQuestionPaper] = useState<QuestionPaper | null>(null);
  const [selectedPaperType, setSelectedPaperType] = useState<string>("");
  const [selectedAttempt, setSelectedAttempt] = useState<AttemptDetail | null>(null);
  const [viewMode, setViewMode] = useState<"analytics" | "qp">("analytics");

  const [loadingTests, setLoadingTests] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);
  const [loadingAttempt, setLoadingAttempt] = useState(false);
  const [loadingQuestionPapers, setLoadingQuestionPapers] = useState(false);

  const [copiedSlug, setCopiedSlug] = useState<string | null>(null);

  const participantsForSelectedPaper = useMemo(() => {
    if (!analytics || !selectedPaperType) return [];
    const found = analytics.paperTypeStats.find((p) => p.paperType === selectedPaperType);
    return found?.participants || [];
  }, [analytics, selectedPaperType]);

  useEffect(() => {
    const token = getToken();
    if (!token) router.push("/login");
    else loadMyTests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function loadMyTests() {
    const token = getToken();
    if (!token) return;

    setLoadingTests(true);
    try {
      const data = await api<{ ok: true; tests: MyTest[] }>("/api/tests/my", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTests(data.tests);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingTests(false);
    }
  }

  async function fetchAnalytics(slug: string) {
    const token = getToken();
    if (!token) return router.push("/login");

    setSelectedSlug(slug);
    setViewMode("analytics");
    setAnalytics(null);
    setQuestionPapers([]);
    setSelectedQuestionPaper(null);
    setSelectedPaperType("");
    setSelectedAttempt(null);
    setLoadingAnalytics(true);

    try {
      const data = await api<{ ok: true; analytics: Analytics }>(`/api/tests/${slug}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(data.analytics);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingAnalytics(false);
    }
  }

  async function fetchQuestionPapers(slug: string) {
    const token = getToken();
    if (!token) return router.push("/login");

    setSelectedSlug(slug);
    setViewMode("qp");
    setAnalytics(null);
    setSelectedPaperType("");
    setSelectedAttempt(null);
    setSelectedQuestionPaper(null);
    setLoadingQuestionPapers(true);

    try {
      const data = await api<{ ok: true; questionPapers: QuestionPaper[] }>(
        `/api/tests/${slug}/question-papers`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setQuestionPapers(data.questionPapers || []);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingQuestionPapers(false);
    }
  }

  async function openAttempt(attemptId: string) {
    setLoadingAttempt(true);
    try {
      const data = await api<{ ok: true; attempt: AttemptDetail }>(`/api/attempts/${attemptId}/detail`);
      setSelectedAttempt(data.attempt);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoadingAttempt(false);
    }
  }

  async function copyLink(slug: string) {
    const link = `${window.location.origin}/t/${slug}`;
    await navigator.clipboard.writeText(link);
    setCopiedSlug(slug);
    setTimeout(() => setCopiedSlug(null), 1200);
  }

  async function deleteTest(slug: string) {
    if (!confirm("Delete this test permanently?")) return;

    try {
      const token = getToken();
      if (!token) return router.push("/login");

      await api(`/api/tests/${slug}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });

      setTests((prev) => prev.filter((t) => t.slug !== slug));

      if (selectedSlug === slug) {
        setSelectedSlug("");
        setAnalytics(null);
        setQuestionPapers([]);
        setSelectedQuestionPaper(null);
        setSelectedPaperType("");
        setSelectedAttempt(null);
      }
    } catch (e: any) {
      alert(e.message);
    }
  }

  function logout() {
    clearToken();
    router.push("/");
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-5 w-full">
      <div className="lg:col-span-2 min-w-0">
        <Card>
          <div className="text-lg font-semibold">Creator Dashboard</div>
          <Divider />

          <div className="flex gap-2">
            <Link href="/create">
              <Button>Create New Test</Button>
            </Link>
            <Button variant="ghost" onClick={logout}>
              Logout
            </Button>
          </div>

          <Divider />

          {loadingTests ? (
            <div className="text-white/60">Loading tests...</div>
          ) : (
            <div className="space-y-3">
              {tests.map((t) => (
                <div key={t.slug} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                  <div className="font-semibold">{t.name}</div>
                  <div className="text-xs text-white/60 break-all">
                    /t/{t.slug} - {t.durationMinutes} mins - {t.totalMarks} marks
                    {typeof t.questionPaperCount === "number" ? ` - ${t.questionPaperCount} papers` : ""}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button onClick={() => fetchAnalytics(t.slug)}>View Analytics</Button>
                    <Button variant="ghost" onClick={() => fetchQuestionPapers(t.slug)}>
                      View QP
                    </Button>

                    <Button variant="ghost" onClick={() => copyLink(t.slug)}>
                      {copiedSlug === t.slug ? <Check size={16} /> : <Copy size={16} />} Copy
                    </Button>

                    <Button
                      variant="ghost"
                      className="text-red-400 hover:text-red-300"
                      onClick={() => deleteTest(t.slug)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <div className="lg:col-span-3 min-w-0">
        <Card>
          <div className="text-lg font-semibold">{viewMode === "qp" ? "Question Papers" : "Analytics"}</div>
          <Divider />

          {!selectedSlug ? (
            <div className="text-white/60">Select a test to view details.</div>
          ) : viewMode === "qp" ? (
            loadingQuestionPapers ? (
              <div className="text-white/60">Loading question papers...</div>
            ) : selectedQuestionPaper ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">
                    Paper Type {selectedQuestionPaper.paperType} ({selectedQuestionPaper.totalQuestions} questions)
                  </div>
                  <Button variant="ghost" onClick={() => setSelectedQuestionPaper(null)}>
                    Back to Papers
                  </Button>
                </div>

                {selectedQuestionPaper.questions.map((q) => (
                  <div key={q.number} className="rounded-xl border border-white/10 bg-white/5 p-4">
                    <div className="text-xs text-white/60">
                      Q{q.number} - {q.type} - {q.marks} mark(s)
                    </div>
                    <div className="mt-2 font-medium text-sm">{q.prompt}</div>
                    {q.options?.length ? (
                      <div className="mt-2 space-y-1 text-sm">
                        {q.options.map((opt, idx) => (
                          <div
                            key={idx}
                            className={`rounded px-2 py-1 ${
                              idx === q.correctIndex ? "bg-green-500/20" : "bg-white/5"
                            }`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {questionPapers.length === 0 ? (
                  <div className="text-white/60">No question papers found.</div>
                ) : (
                  questionPapers.map((paper) => (
                    <button
                      key={paper.paperType}
                      type="button"
                      onClick={() => setSelectedQuestionPaper(paper)}
                      className="w-full rounded-xl border border-white/10 bg-white/5 p-4 text-left hover:bg-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-semibold">Paper Type {paper.paperType}</div>
                        <div className="text-neon-500 font-semibold">{paper.totalQuestions} questions</div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )
          ) : loadingAnalytics ? (
            <div className="text-white/60">Loading analytics...</div>
          ) : selectedAttempt ? (
            <div className="space-y-4">
              <div className="text-sm">
                <b>{selectedAttempt.participantName}</b> - Paper Type{" "}
                <span className="text-neon-500 font-semibold">{selectedAttempt.questionPaperType || "A"}</span>
              </div>

              <div className="text-sm">
                Score <span className="text-neon-500 font-semibold">{selectedAttempt.score}</span>
              </div>

              <div className="text-xs text-white/60">
                Submitted at: {selectedAttempt.submittedAt ? new Date(selectedAttempt.submittedAt).toLocaleString() : "-"}
              </div>

              {selectedAttempt.questions.map((q, i) => (
                <div
                  key={i}
                  className={`rounded-xl border p-4 ${
                    q.isCorrect === true
                      ? "border-green-500/40 bg-green-500/10"
                      : q.isCorrect === false
                      ? "border-red-500/40 bg-red-500/10"
                      : "border-gray-400/30 bg-gray-400/10"
                  }`}
                >
                  <div className="font-medium text-sm">Q{i + 1}. {q.prompt}</div>

                  {q.options && (
                    <div className="mt-2 space-y-1 text-sm">
                      {q.options.map((opt, oi) => (
                        <div
                          key={oi}
                          className={`rounded px-2 py-1 ${
                            oi === q.correctIndex ? "bg-green-500/20" : oi === q.selectedIndex ? "bg-red-500/20" : ""
                          }`}
                        >
                          {opt}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2 text-sm font-semibold">
                    {q.isCorrect === true && <span className="text-green-400">Correct</span>}
                    {q.isCorrect === false && <span className="text-red-400">Wrong</span>}
                    {q.isCorrect === null && <span className="text-gray-300">Not Attempted</span>}
                  </div>
                </div>
              ))}

              <Button variant="ghost" onClick={() => setSelectedAttempt(null)}>
                Back to Users
              </Button>
            </div>
          ) : selectedPaperType ? (
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold">Paper Type {selectedPaperType}</div>
                <Button variant="ghost" onClick={() => setSelectedPaperType("")}>Back to Paper Types</Button>
              </div>

              {participantsForSelectedPaper.length === 0 ? (
                <div className="text-white/60">No submissions yet for this paper type.</div>
              ) : (
                <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                  <div className="text-sm font-semibold">Users</div>
                  <div className="mt-3 space-y-2">
                    {participantsForSelectedPaper.map((p, idx) => (
                      <div
                        key={p.id}
                        onClick={() => openAttempt(p.id)}
                        className="cursor-pointer rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                      >
                        <div className="flex justify-between gap-2 break-words">
                          <div>#{idx + 1} {p.name}</div>
                          <div className="font-semibold text-neon-500">{p.score}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-5">
              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm text-white/60">Average score</div>
                <div className="text-3xl font-semibold text-neon-500">{analytics?.averageScore.toFixed(2)}</div>
              </div>

              <div className="rounded-3xl border border-white/10 bg-white/5 p-5">
                <div className="text-sm font-semibold">Question Paper Type Analytics</div>
                <div className="mt-3 space-y-2">
                  {(analytics?.paperTypeStats || []).map((paper) => (
                    <button
                      type="button"
                      key={paper.paperType}
                      onClick={() => setSelectedPaperType(paper.paperType)}
                      className="w-full text-left rounded-xl border border-white/10 bg-white/5 p-3 hover:bg-white/10"
                    >
                      <div className="flex justify-between gap-2 break-words">
                        <div>Type {paper.paperType}</div>
                        <div className="font-semibold text-neon-500">{paper.totalParticipants} users</div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {loadingAttempt ? <div className="mt-4 text-white/60">Loading attempt...</div> : null}
        </Card>
      </div>
    </div>
  );
}
