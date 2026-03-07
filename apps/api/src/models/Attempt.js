const mongoose = require("mongoose");

/**
 * Questions actually served to a participant (snapshot)
 */
const ServedQuestionSchema = new mongoose.Schema(
  {
    questionIndex: Number, // local index (0..N-1)
    type: String,
    prompt: String,
    options: [String],
    correctIndex: Number,
    marks: Number,
  },
  { _id: false }
);

/**
 * Answers submitted by participant
 */
const AnswerSchema = new mongoose.Schema(
  {
    questionIndex: { type: Number, required: true }, // local index
    mcqIndex: { type: Number, default: null },
    sentenceText: { type: String, default: "" },
  },
  { _id: false }
);

const AttemptSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
    },

    participantName: { type: String, required: true },
    participantEmail: { type: String, default: "" },

    // Which generated question paper this participant received.
    questionPaperType: { type: String, default: "A" },
    questionPaperIndex: { type: Number, default: 0 },

    // Single source of truth for what was served.
    servedQuestions: { type: [ServedQuestionSchema], default: [] },

    answers: { type: [AnswerSchema], default: [] },

    score: { type: Number, default: 0 },
    submittedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

AttemptSchema.index({ testId: 1, submittedAt: 1, score: -1 });
AttemptSchema.index({ testId: 1, createdAt: -1 });
AttemptSchema.index({ testId: 1, questionPaperType: 1, submittedAt: 1 });

module.exports = mongoose.model("Attempt", AttemptSchema);
