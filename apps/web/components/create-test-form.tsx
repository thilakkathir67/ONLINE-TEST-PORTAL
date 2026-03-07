"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { useRouter } from "next/navigation";
import { getToken } from "../lib/auth";
import { Button, Card, Divider, Input, Label, Select, Textarea } from "./ui";
import { Plus, Sparkles, Trash2, Copy, Check } from "lucide-react";

type QType = "MCQ";
type Source = "MANUAL" | "AI";

type Question = {
  type: QType;
  prompt: string;
  options?: string[];
  correctIndex?: number;
  marks?: number;
  explanation?: string;
  source?: Source;
};

export function CreateTestForm() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);

  // Force login to create test
  useEffect(() => {
    const token = getToken();
    if (!token) {
      router.replace("/login?reason=create-test");
    } else {
      setCheckingAuth(false);
    }
  }, [router]);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(30);
  const [totalMarks] = useState(10);
  const [questionType] = useState<"MCQ">("MCQ");
  const [questionsToShow, setQuestionsToShow] = useState(0);
  const [questionPaperCount, setQuestionPaperCount] = useState(1);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [creating, setCreating] = useState(false);

  // AI generator controls
  const [aiCount, setAiCount] = useState(5);
  const [aiDifficulty, setAiDifficulty] =
    useState<"easy" | "medium" | "hard">("easy");
  const [aiTopic, setAiTopic] = useState("Java Arrays");
  const aiType: "MCQ" = "MCQ";
  const [aiLoading, setAiLoading] = useState(false);

  const [createdTest, setCreatedTest] = useState<{
    id: string;
    slug: string;
    name: string;
    durationMinutes: number;
    totalMarks: number;
    questionsCount: number;
    questionPaperCount: number;
  } | null>(null);

  const [copied, setCopied] = useState(false);

  const computedMarks = useMemo(() => {
    return questions.reduce((acc, q) => acc + (q.marks ?? 1), 0);
  }, [questions]);

  function addManualMCQ() {
    setQuestions((prev) => [
      ...prev,
      {
        type: "MCQ",
        prompt: "New MCQ question...",
        options: ["Option A", "Option B", "Option C", "Option D"],
        correctIndex: 0,
        marks: 1,
        source: "MANUAL",
      },
    ]);
  }

  function generateManualTemplates() {
  if (questionsToShow <= 0) {
    alert("Enter number of questions per student first");
    return;
  }

  const totalTemplates = Math.ceil(questionsToShow * 1.5);

  if (questions.length > 0) {
    const ok = confirm(
      `This will generate ${totalTemplates} questions (including 50% extra) and remove existing ones. Continue?`
    );
    if (!ok) return;
  }

  const templates: Question[] = [];

  for (let i = 0; i < totalTemplates; i++) {
    templates.push({
      type: "MCQ",
      prompt: `MCQ Question ${i + 1}`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: 0,
      marks: 1,
      source: "MANUAL",
    });
  }

  setQuestions(templates);
}

  async function generateAI() {
    setAiLoading(true);
    try {
      const data = await api<{ ok: true; questions: Question[] }>(
        "/api/ai/generate",
        {
          method: "POST",
          body: JSON.stringify({
            count: aiCount,
            difficulty: aiDifficulty,
            topic: aiTopic,
            questionType: aiType,
          }),
        }
      );

      setQuestions((prev) => [
        ...prev,
        ...data.questions.map((q) => ({ ...q, source: "AI" as const })),
      ]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setAiLoading(false);
    }
  }

  function updateQuestion(idx: number, patch: Partial<Question>) {
    setQuestions((prev) =>
      prev.map((q, i) => (i === idx ? { ...q, ...patch } : q))
    );
  }

  function removeQuestion(idx: number) {
    setQuestions((prev) => prev.filter((_, i) => i !== idx));
  }

  async function createTest() {
    if (!name.trim()) return alert("Test name required");
    if (questions.length === 0) return alert("Add at least 1 question");
    if (questionsToShow <= 0)
      return alert("Enter how many questions each student should get");
    if (questionPaperCount <= 0)
      return alert("Enter how many question papers should be generated");

    const minRequired = Math.ceil(questionsToShow * 1.5);
    if (questions.length < minRequired) {
      return alert(
        `You must add at least ${minRequired} questions (50% extra for randomization)`
      );
    }

    setCreating(true);
    try {
      const token = getToken();

      const res = await api<{ ok: true; test: { id: string; slug: string } }>(
        "/api/tests",
        {
          method: "POST",
          body: JSON.stringify({
            name,
            description,
            durationMinutes: Number(durationMinutes),
            totalMarks: Number(questionsToShow),
            questionType,
            questions,
            totalQuestionsToShow: questionsToShow,
            questionPaperCount,
          }),
          headers: token ? { Authorization: `Bearer ${token}` } : undefined,
        }
      );

      setCreatedTest({
        id: res.test.id,
        slug: res.test.slug,
        name,
        durationMinutes,
        totalMarks: Number(questionsToShow),
        questionsCount: questions.length,
        questionPaperCount,
      });

      if (token) router.push("/dashboard");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setCreating(false);
    }
  }

  async function copyLink() {
    if (!createdTest) return;
    const link = `${window.location.origin}/t/${createdTest.slug}`;
    await navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 1200);
  }

  if (checkingAuth) return null;


return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="lg:col-span-3">
        <Card>
          <div className="text-lg font-semibold">Test Details</div>

          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Test name</Label>
              <div className="mt-2">
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Aptitude Mock #1" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <Label>Description</Label>
              <div className="mt-2">
                <Textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Short description (optional)"
                  rows={3}
                />
              </div>
            </div>

            <div>
              <Label>Duration (minutes)</Label>
              <div className="mt-2">
                <Input
                  type="number"
                  value={durationMinutes}
                  onChange={(e) => setDurationMinutes(Number(e.target.value))}
                  min={1}
                />
              </div>
            </div>

            <div>
  <Label>Total marks</Label>
  <div className="mt-2 text-sm text-white font-semibold">
    {questionsToShow} marks(auto calculated)
      </div>
</div>

<div>
  <Label>Questions per student</Label>
  <div className="mt-2">
    <Input
      className="no-spinner"
      type="number"
      min={1}
      value={questionsToShow}
      onChange={(e) => setQuestionsToShow(Number(e.target.value))}
      placeholder="e.g., 30"
    />
  </div>
  <div className="mt-1 text-xs text-white/60">
    Add at least 50% extra questions for smart randomization
  </div>
</div>

<div>
  <Label>Question papers count</Label>
  <div className="mt-2">
    <Input
      className="no-spinner"
      type="number"
      min={1}
      value={questionPaperCount}
      onChange={(e) => setQuestionPaperCount(Number(e.target.value))}
      placeholder="e.g., 5"
    />
  </div>
  <div className="mt-1 text-xs text-white/60">
    Pre-generate shuffled papers (A, B, C...) from the pool
  </div>
</div>


            <div className="sm:col-span-2">
              <Label>Question type</Label>
              <div className="mt-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white">
                MCQ
              </div>
              </div>
            </div>
          <Divider />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Questions</div>
              <div className="text-sm text-white/60">
                {questions.length} questions - computed marks: <span className="text-white">{computedMarks}</span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button variant="ghost" onClick={addManualMCQ}>
                <Plus size={16} /> Add MCQ
              </Button>
              <Button variant="ghost" onClick={generateManualTemplates}>
  Generate Empty Questions
</Button>

            </div>
          </div>

          <div className="mt-5 space-y-4">
            {questions.map((q, idx) => (
              <div key={idx} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-xs text-white/60">
                    Q{idx + 1} - {q.type} - <span className="text-neon-500">{q.source}</span>
                  </div>
                  <Button variant="danger" onClick={() => removeQuestion(idx)}>
                    <Trash2 size={16} /> Delete
                  </Button>
                </div>

                <div className="mt-3">
                  <Label>Prompt</Label>
                  <div className="mt-2">
                    <Textarea
  className="no-resize"
  value={q.prompt}
  onChange={(e) => updateQuestion(idx, { prompt: e.target.value })}
  rows={3}
  onInput={(e) => {
    const el = e.currentTarget;
    el.style.height = "auto";
    el.style.height = el.scrollHeight + "px";
  }}
/>

                  </div>
                </div>

                <div className="mt-3 grid gap-3 sm:grid-cols-3">
                  

                  {q.type === "MCQ" ? (
                    <>
                      <div className="sm:col-span-2">
                        <Label>Options</Label>
                        <div className="mt-2 grid gap-2 sm:grid-cols-2">
                          {(q.options || []).map((opt, oi) => (
                            <Input
                              key={oi}
                              value={opt}
                              onChange={(e) => {
                                const next = [...(q.options || [])];
                                next[oi] = e.target.value;
                                updateQuestion(idx, { options: next });
                              }}
                            />
                          ))}
                        </div>
                      </div>

                      <div className="sm:col-span-2">
                        <Label>Correct answer</Label>
                        <div className="mt-2">
                          <Select
                            value={q.correctIndex ?? 0}
                            onChange={(e) => updateQuestion(idx, { correctIndex: Number(e.target.value) })}
                          >
                            {(q.options || []).map((_, oi) => (
                              <option key={oi} value={oi}>
                                Option {String.fromCharCode(65 + oi)}
                              </option>
                            ))}
                          </Select>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="sm:col-span-2">
                      <Label>Answer type</Label>
                      <div className="mt-2 text-sm text-white/60">
                        Descriptive answers are stored and can be evaluated manually later.
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <Divider />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-wrap gap-2">
              <Button onClick={createTest} disabled={creating}>
                {creating ? "Creating..." : "Generate Share Link"}
              </Button>

              {/* Always visible when logged in */}
              <Button variant="ghost" onClick={() => router.push("/dashboard")}>
              View My Tests
              </Button>

            </div>

            {createdTest && (
              <div className="flex flex-col items-start gap-2 sm:items-end">
                <div className="text-sm text-white/60">
                  Test created: <span className="text-white font-semibold">{createdTest.name}</span>
                </div>

                <div className="text-sm text-white/60">
                  Share link:{" "}
                  <Link className="text-neon-500 hover:underline" href={`/t/${createdTest.slug}`}>
                    /t/{createdTest.slug}
                  </Link>
                </div>

                <div className="text-xs text-white/50">
                  {createdTest.questionsCount} questions • {createdTest.questionPaperCount} papers • {createdTest.durationMinutes} mins • {createdTest.totalMarks} marks
                </div>

                <Button variant="ghost" onClick={copyLink}>
                  {copied ? <Check size={16} /> : <Copy size={16} />} Copy Link
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>

      <div className="lg:col-span-2">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <div className="text-lg font-semibold">AI Question Generation</div>
              <div className="text-sm text-white/60">Generate and mix with manual questions.</div>
            </div>
            <div className="rounded-full bg-neon-500/10 px-3 py-1 text-xs text-neon-500">
              <Sparkles size={14} className="inline" /> AI
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            <div>
              <Label>Topic / Subject</Label>
              <div className="mt-2">
                <Input
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Polity - Fundamental Rights"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label>Questions</Label>
                <div className="mt-2">
                  <Input type="number" min={1} max={50} value={aiCount} onChange={(e) => setAiCount(Number(e.target.value))} />
                </div>
              </div>
              <div>
                <Label>Difficulty</Label>
                <div className="mt-2">
                  <Select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value as any)}>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </Select>
                </div>
              </div>
            </div>

            <div>
              <Label>Question type</Label>
              <div className="mt-2">
                <Select value={aiType} disabled>
                  <option value="MCQ">MCQ</option>
                  
                </Select>
                <div className="text-xs text-white/60 mt-1">AI currently generates MCQ only</div>
              </div>
            </div>

            <Button onClick={generateAI} disabled={aiLoading}>
              {aiLoading ? "Generating..." : "Generate Questions"}
            </Button>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-white/60">
              Tip: Generate first, then edit prompts/options and add manual questions for higher quality.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
