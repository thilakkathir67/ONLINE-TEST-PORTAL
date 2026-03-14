const router = require("express").Router();
const { z } = require("zod");

const inputSchema = z.object({
  count: z.number().int().min(1).max(75),
  difficulty: z.enum(["easy", "medium", "hard"]),
  topic: z.string().min(2),
  questionType: z.enum(["MCQ"]),
});

function mockQuestions({ count, difficulty, topic }) {
  const base = `${topic} (${difficulty})`;
  const out = [];
  for (let i = 1; i <= count; i++) {
    out.push({
      type: "MCQ",
      prompt: `(${i}) ${base}: Choose the correct option.`,
      options: ["Option A", "Option B", "Option C", "Option D"],
      correctIndex: (i - 1) % 4,
      marks: 1,
      explanation: "Mock explanation",
      source: "AI",
    });
  }
  return out;
}

function buildPrompt({ count, difficulty, topic }) {
  return [
    `Generate exactly ${count} multiple-choice questions.`,
    `Topic: ${topic}`,
    `Difficulty: ${difficulty}`,
    "Return ONLY valid JSON in this shape:",
    '{"questions":[{"type":"MCQ","prompt":"...","options":["A","B","C","D"],"correctIndex":0,"marks":1,"explanation":"..."}]}',
    "Rules:",
    "- Exactly 4 options per question",
    "- correctIndex must be 0 to 3",
    "- marks must be 1",
    "- No markdown, no code fences, no extra keys",
  ].join("\n");
}

function extractJson(text) {
  if (!text || typeof text !== "string") {
    throw Object.assign(new Error("AI provider returned empty response."), { status: 502 });
  }

  try {
    return JSON.parse(text);
  } catch (_) {
    const match = text.match(/```json\s*([\s\S]*?)\s*```/i) || text.match(/```\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
      return JSON.parse(match[1]);
    }
    throw Object.assign(new Error("AI provider returned non-JSON content."), { status: 502 });
  }
}

function normalizeQuestions(raw, count) {
  const list = Array.isArray(raw) ? raw : raw?.questions;
  if (!Array.isArray(list) || list.length === 0) {
    throw Object.assign(new Error("AI provider response did not include questions."), { status: 502 });
  }

  const normalized = list
    .slice(0, count)
    .map((q, i) => {
      const prompt = typeof q?.prompt === "string" && q.prompt.trim() ? q.prompt.trim() : `Question ${i + 1}`;

      const rawOptions = Array.isArray(q?.options)
        ? q.options.filter((opt) => typeof opt === "string" && opt.trim()).map((opt) => opt.trim())
        : [];

      const options = rawOptions.slice(0, 4);
      while (options.length < 4) {
        options.push(`Option ${String.fromCharCode(65 + options.length)}`);
      }

      const rawCorrect = Number.isInteger(q?.correctIndex) ? q.correctIndex : 0;
      const correctIndex = rawCorrect >= 0 && rawCorrect < options.length ? rawCorrect : 0;

      const marks = Number.isInteger(q?.marks) && q.marks > 0 ? q.marks : 1;
      const explanation = typeof q?.explanation === "string" ? q.explanation : "";

      return {
        type: "MCQ",
        prompt,
        options,
        correctIndex,
        marks,
        explanation,
        source: "AI",
      };
    })
    .filter((q) => q.prompt);

  if (!normalized.length) {
    throw Object.assign(new Error("AI provider returned invalid questions."), { status: 502 });
  }

  return normalized;
}

function resolveProvider() {
  const provider = String(process.env.AI_PROVIDER || "auto").toLowerCase();
  const hasOpenAI = Boolean(process.env.OPENAI_API_KEY);
  const hasGemini = Boolean(process.env.GEMINI_API_KEY);
  const hasGroq = Boolean(process.env.GROQ_API_KEY);

  if (provider === "openai" || provider === "gemini" || provider === "groq" || provider === "mock") {
    if (provider === "mock" && hasOpenAI) return "openai";
    if (provider === "mock" && !hasOpenAI && hasGemini) return "gemini";
    if (provider === "mock" && !hasOpenAI && !hasGemini && hasGroq) return "groq";
    return provider;
  }

  if (hasOpenAI) return "openai";
  if (hasGemini) return "gemini";
  if (hasGroq) return "groq";
  return "mock";
}

async function generateWithOpenAI(payload) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("OPENAI_API_KEY is missing."), { status: 400 });
  }

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";
  const prompt = buildPrompt(payload);

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You create high-quality MCQ questions and always return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw Object.assign(new Error(`OpenAI request failed: ${response.status} ${txt}`), { status: 502 });
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = extractJson(content);
  return normalizeQuestions(parsed, payload.count);
}

async function generateWithGemini(payload) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("GEMINI_API_KEY is missing."), { status: 400 });
  }

  const prompt = buildPrompt(payload);
  const modelCandidates = [
    process.env.GEMINI_MODEL,
    "gemini-2.0-flash",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
  ].filter(Boolean);

  let lastErrorText = "";
  for (const model of modelCandidates) {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: "application/json",
          },
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const content = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      const parsed = extractJson(content);
      return normalizeQuestions(parsed, payload.count);
    }

    const txt = await response.text();
    lastErrorText = `Gemini model ${model} failed: ${response.status} ${txt}`;
    if (response.status !== 404) {
      throw Object.assign(new Error(lastErrorText), { status: 502 });
    }
  }

  throw Object.assign(
    new Error(
      lastErrorText ||
        "Gemini request failed: no compatible model found. Set GEMINI_MODEL in .env to a model that supports generateContent."
    ),
    { status: 502 }
  );
}

async function generateWithGroq(payload) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    throw Object.assign(new Error("GROQ_API_KEY is missing."), { status: 400 });
  }

  const model = process.env.GROQ_MODEL || "llama-3.1-8b-instant";
  const prompt = buildPrompt(payload);

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "You create high-quality MCQ questions and always return strict JSON only.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    }),
  });

  if (!response.ok) {
    const txt = await response.text();
    throw Object.assign(new Error(`Groq request failed: ${response.status} ${txt}`), { status: 502 });
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  const parsed = extractJson(content);
  return normalizeQuestions(parsed, payload.count);
}

router.post("/generate", async (req, res, next) => {
  try {
    const payload = inputSchema.parse(req.body);

    const provider = resolveProvider();
    let questions;

    if (provider === "openai") {
      questions = await generateWithOpenAI(payload);
    } else if (provider === "gemini") {
      questions = await generateWithGemini(payload);
    } else if (provider === "groq") {
      questions = await generateWithGroq(payload);
    } else {
      questions = mockQuestions(payload);
    }

    res.json({ ok: true, provider, questions });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
