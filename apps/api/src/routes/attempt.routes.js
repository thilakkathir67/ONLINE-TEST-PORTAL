const router = require("express").Router();
const { z } = require("zod");
const Test = require("../models/Test");
const Attempt = require("../models/Attempt");

function fisherYates(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * START TEST
 * Assign a random pre-generated question paper and store what was served.
 */
router.post("/:slug/start", async (req, res, next) => {
  try {
    const schema = z.object({
      participantName: z.string().min(2),
      participantEmail: z.string().email().optional().or(z.literal("")),
    });

    const { participantName, participantEmail } = schema.parse(req.body);

    const test = await Test.findOne({ slug: req.params.slug })
      .select("questions questionPapers totalQuestionsToShow durationMinutes")
      .lean();
    if (!test) {
      return res.status(404).json({ ok: false, message: "Test not found" });
    }

    let selectedPaperType = "A";
    let selectedPaperIndex = 0;
    let served = [];

    if (Array.isArray(test.questionPapers) && test.questionPapers.length > 0) {
      selectedPaperIndex = Math.floor(Math.random() * test.questionPapers.length);
      const selectedPaper = test.questionPapers[selectedPaperIndex];
      selectedPaperType = selectedPaper?.paperType || "A";
      served = selectedPaper?.questions || [];
    } else {
      // Backward compatibility for older tests created before question papers existed.
      served = fisherYates(test.questions || []).slice(0, test.totalQuestionsToShow);
    }

    const attempt = await Attempt.create({
      testId: test._id,
      participantName,
      participantEmail: participantEmail || "",
      questionPaperType: selectedPaperType,
      questionPaperIndex: selectedPaperIndex,
      servedQuestions: served.map((q, idx) => ({
        questionIndex: idx,
        type: q.type,
        prompt: q.prompt,
        options: q.options || [],
        correctIndex: q.correctIndex ?? null,
        marks: q.marks || 1,
      })),
      answers: [],
      score: 0,
      submittedAt: null,
    });

    const questions = attempt.servedQuestions.map((q, idx) => ({
      number: idx + 1,
      type: q.type,
      prompt: q.prompt,
      options: q.options || [],
      selectedIndex: null,
      isCorrect: null,
    }));

    res.json({
      ok: true,
      attemptId: attempt._id,
      attempt: {
        participantName: attempt.participantName,
        questionPaperType: attempt.questionPaperType,
        submittedAt: attempt.submittedAt,
        score: attempt.score,
        durationMinutes: test.durationMinutes,
        questions,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * SUBMIT TEST
 * Score only from servedQuestions
 */
router.post("/:attemptId/submit", async (req, res, next) => {
  try {
    const schema = z.object({
      answers: z.array(
        z.object({
          questionIndex: z.number().int().min(0),
          mcqIndex: z.number().int().nullable().optional(),
          sentenceText: z.string().optional(),
        })
      ),
    });

    const { answers } = schema.parse(req.body);

    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return res.status(404).json({ ok: false, message: "Attempt not found" });
    }

    let score = 0;
    const servedByIndex = new Map(attempt.servedQuestions.map((sq) => [sq.questionIndex, sq]));

    for (const ans of answers) {
      const q = servedByIndex.get(ans.questionIndex);
      if (!q) continue;

      if (q.type === "MCQ" && typeof ans.mcqIndex === "number") {
        if (ans.mcqIndex === q.correctIndex) {
          score += q.marks || 1;
        }
      }
    }

    const normalizedAnswers = answers.map((a) => ({
      questionIndex: a.questionIndex,
      mcqIndex: a.mcqIndex ?? null,
      sentenceText: a.sentenceText ?? "",
    }));

    const totalMarks = attempt.servedQuestions.reduce((sum, q) => sum + (q.marks || 1), 0);

    const updated = await Attempt.findOneAndUpdate(
      { _id: req.params.attemptId, submittedAt: null },
      {
        $set: {
          answers: normalizedAnswers,
          score,
          submittedAt: new Date(),
        },
      },
      { new: true }
    ).lean();

    if (!updated) {
      // Idempotent response for duplicate submits/race conditions.
      const existing = await Attempt.findById(req.params.attemptId)
        .select("score submittedAt")
        .lean();

      if (!existing) {
        return res.status(404).json({ ok: false, message: "Attempt not found" });
      }

      return res.json({
        ok: true,
        score: existing.score || 0,
        totalMarks,
        alreadySubmitted: true,
      });
    }

    res.json({ ok: true, score: updated.score, totalMarks });
  } catch (e) {
    next(e);
  }
});

/**
 * ATTEMPT DETAIL (Analytics Drill-Down)
 * Show only served questions in correct order
 */
router.get("/:attemptId/detail", async (req, res, next) => {
  try {
    const attempt = await Attempt.findById(req.params.attemptId).lean();
    if (!attempt) {
      return res.status(404).json({ ok: false, message: "Attempt not found" });
    }

    const answersByIndex = new Map((attempt.answers || []).map((a) => [a.questionIndex, a]));

    const questions = attempt.servedQuestions.map((q, idx) => {
      const ans = answersByIndex.get(q.questionIndex);

      let isCorrect = null;
      if (!ans || ans.mcqIndex === null || ans.mcqIndex === undefined) {
        isCorrect = null;
      } else if (q.type === "MCQ") {
        isCorrect = ans.mcqIndex === q.correctIndex;
      }

      return {
        number: idx + 1,
        type: q.type,
        prompt: q.prompt,
        options: q.options || [],
        correctIndex: q.correctIndex,
        selectedIndex: ans?.mcqIndex ?? null,
        isCorrect,
      };
    });

    res.json({
      ok: true,
      attempt: {
        participantName: attempt.participantName,
        questionPaperType: attempt.questionPaperType || "A",
        score: attempt.score,
        submittedAt: attempt.submittedAt,
        questions,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
