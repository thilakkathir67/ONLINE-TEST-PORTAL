const router = require("express").Router();
const { z } = require("zod");
const { randomBytes } = require("crypto");
const Test = require("../models/Test");
const Attempt = require("../models/Attempt");
const { authRequired, authOptional } = require("../middleware/auth");

function fisherYates(list) {
  const copy = [...list];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function paperTypeFromIndex(index) {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < alphabet.length) return alphabet[index];
  return `P${index + 1}`;
}

function buildQuestionPapers(poolQuestions, totalQuestionsToShow, questionPaperCount) {
  return Array.from({ length: questionPaperCount }, (_, i) => ({
    paperType: paperTypeFromIndex(i),
    questions: fisherYates(poolQuestions).slice(0, totalQuestionsToShow),
  }));
}

function setPublicCache(res, seconds) {
  res.set("Cache-Control", `public, max-age=${seconds}, stale-while-revalidate=${seconds * 2}`);
}

function createSlug(length = 10) {
  return randomBytes(Math.ceil(length * 0.75))
    .toString("base64url")
    .slice(0, length);
}

/**
 * POST /api/tests
 * Create test with 50% extra questions rule + pre-generated papers.
 */
router.post("/", authOptional, async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      description: z.string().optional().default(""),
      durationMinutes: z.number().int().min(1).max(600),
      totalMarks: z.number().int().min(1).max(10000),
      totalQuestionsToShow: z.number().int().min(1),
      questionPaperCount: z.number().int().min(1).max(200),
      questionType: z.enum(["MCQ"]),
      questions: z.array(
        z.object({
          type: z.enum(["MCQ"]),
          prompt: z.string().min(1),
          options: z.array(z.string()).optional(),
          correctIndex: z.number().int().optional(),
          marks: z.number().int().min(1).max(100).optional(),
          explanation: z.string().optional(),
          source: z.enum(["MANUAL", "AI"]).optional(),
        })
      ),
    });

    const payload = schema.parse(req.body);
    const minRequired = Math.ceil(payload.totalQuestionsToShow * 1.5);
    if (payload.questions.length < minRequired) {
      return res.status(400).json({
        ok: false,
        message: `You must add at least ${minRequired} questions (50% extra rule)`,
      });
    }

    const questionPapers = buildQuestionPapers(
      payload.questions,
      payload.totalQuestionsToShow,
      payload.questionPaperCount
    );

    const slug = createSlug(10);
    const test = await Test.create({
      ownerId: req.user?.userId || null,
      slug,
      name: payload.name,
      description: payload.description || "",
      durationMinutes: payload.durationMinutes,
      totalMarks: payload.totalMarks,
      totalQuestionsToShow: payload.totalQuestionsToShow,
      questionPaperCount: payload.questionPaperCount,
      questionType: payload.questionType,
      questions: payload.questions,
      questionPapers,
    });

    res.json({ ok: true, test: { id: test._id, slug: test.slug } });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/tests/my
 * Creator dashboard
 */
router.get("/my", authRequired, async (req, res, next) => {
  try {
    const tests = await Test.find({ ownerId: req.user.userId })
      .sort({ createdAt: -1 })
      .select("name slug createdAt durationMinutes totalMarks questionType questionPaperCount")
      .lean();

    res.json({ ok: true, tests });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/tests/:slug/question-papers
 * Creator-only question paper view
 */
router.get("/:slug/question-papers", authRequired, async (req, res, next) => {
  try {
    const test = await Test.findOne({ slug: req.params.slug })
      .select("_id ownerId name totalQuestionsToShow questionPapers questions")
      .lean();

    if (!test) {
      return res.status(404).json({ ok: false, message: "Test not found" });
    }

    if (!test.ownerId || String(test.ownerId) !== String(req.user.userId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const papers =
      Array.isArray(test.questionPapers) && test.questionPapers.length > 0
        ? test.questionPapers
        : [
            {
              paperType: "A",
              questions: fisherYates(test.questions || []).slice(0, test.totalQuestionsToShow),
            },
          ];

    res.json({
      ok: true,
      test: {
        name: test.name,
        totalQuestionsToShow: test.totalQuestionsToShow,
      },
      questionPapers: papers.map((paper) => ({
        paperType: paper.paperType,
        totalQuestions: (paper.questions || []).length,
        questions: (paper.questions || []).map((q, idx) => ({
          number: idx + 1,
          type: q.type,
          prompt: q.prompt,
          options: q.options || [],
          marks: q.marks || 1,
          correctIndex: q.correctIndex ?? null,
        })),
      })),
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/tests/:slug
 * Public metadata + sample paper preview
 */
router.get("/:slug", async (req, res, next) => {
  try {
    setPublicCache(res, 30);

    const test = await Test.findOne({ slug: req.params.slug })
      .select(
        "slug name description durationMinutes totalMarks questionType totalQuestionsToShow questionPaperCount questions questionPapers"
      )
      .lean();
    if (!test) return res.status(404).json({ ok: false, message: "Test not found" });

    const selectedPaper =
      test.questionPapers && test.questionPapers.length > 0
        ? test.questionPapers[Math.floor(Math.random() * test.questionPapers.length)]
        : {
            paperType: "A",
            questions: fisherYates(test.questions).slice(0, test.totalQuestionsToShow),
          };

    const publicQuestions = (selectedPaper.questions || []).map((q) => ({
      type: q.type,
      prompt: q.prompt,
      options: q.options || [],
      marks: q.marks || 1,
      source: q.source || "MANUAL",
    }));

    res.json({
      ok: true,
      test: {
        id: test._id,
        slug: test.slug,
        name: test.name,
        description: test.description,
        durationMinutes: test.durationMinutes,
        totalMarks: test.totalMarks,
        questionType: test.questionType,
        questionPaperCount: test.questionPaperCount || (test.questionPapers || []).length || 1,
        previewPaperType: selectedPaper.paperType,
        questions: publicQuestions,
      },
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/tests/:slug/analytics
 */
router.get("/:slug/analytics", authRequired, async (req, res, next) => {
  try {
    const test = await Test.findOne({ slug: req.params.slug })
      .select("_id ownerId questionPapers.paperType questionPaperCount")
      .lean();
    if (!test) {
      return res.status(404).json({ ok: false, message: "Test not found" });
    }

    if (!test.ownerId || String(test.ownerId) !== String(req.user.userId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    const attempts = await Attempt.find({ testId: test._id, submittedAt: { $ne: null } })
      .sort({ score: -1, submittedAt: 1 })
      .select("participantName participantEmail score submittedAt questionPaperType")
      .lean();

    const participants = attempts.map((a) => ({
      id: a._id,
      name: a.participantName,
      email: a.participantEmail,
      score: a.score,
      submittedAt: a.submittedAt,
      paperType: a.questionPaperType || "A",
    }));

    const avg =
      participants.length === 0
        ? 0
        : participants.reduce((sum, a) => sum + a.score, 0) / participants.length;

    const knownPaperTypes = [
      ...new Set([
        ...((test.questionPapers || []).map((p) => p.paperType) || []),
        ...participants.map((p) => p.paperType),
      ]),
    ];

    if (knownPaperTypes.length === 0) {
      const fallbackCount = test.questionPaperCount || 1;
      for (let i = 0; i < fallbackCount; i++) {
        knownPaperTypes.push(paperTypeFromIndex(i));
      }
    }

    const groupedByPaperType = new Map(knownPaperTypes.map((paperType) => [paperType, []]));
    for (const participant of participants) {
      if (!groupedByPaperType.has(participant.paperType)) {
        groupedByPaperType.set(participant.paperType, []);
      }
      groupedByPaperType.get(participant.paperType).push(participant);
    }

    const paperTypeStats = knownPaperTypes.map((paperType) => {
      const grouped = groupedByPaperType.get(paperType) || [];
      return { paperType, totalParticipants: grouped.length, participants: grouped };
    });

    res.json({
      ok: true,
      analytics: {
        participants,
        paperTypeStats,
        averageScore: avg,
      },
    });
  } catch (e) {
    next(e);
  }
});

router.get("/:slug/leaderboard", async (req, res, next) => {
  try {
    setPublicCache(res, 15);

    const test = await Test.findOne({ slug: req.params.slug }).select("_id").lean();
    if (!test) return res.status(404).json({ ok: false });

    const attempts = await Attempt.find({
      testId: test._id,
      submittedAt: { $ne: null },
    })
      .sort({ score: -1, submittedAt: 1 })
      .select("participantName score submittedAt")
      .lean();

    res.json({ ok: true, leaderboard: attempts });
  } catch (e) {
    next(e);
  }
});

router.delete("/:slug", authRequired, async (req, res, next) => {
  try {
    const test = await Test.findOne({ slug: req.params.slug }).select("_id ownerId");
    if (!test) {
      return res.status(404).json({ ok: false, message: "Test not found" });
    }

    if (!test.ownerId || String(test.ownerId) !== String(req.user.userId)) {
      return res.status(403).json({ ok: false, message: "Forbidden" });
    }

    await Attempt.deleteMany({ testId: test._id });
    await Test.deleteOne({ _id: test._id });

    res.json({ ok: true, message: "Test deleted successfully" });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
