const mongoose = require("mongoose");

const QuestionSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ["MCQ", "SENTENCE"], required: true },
    prompt: { type: String, required: true },
    options: [{ type: String }],
    correctIndex: { type: Number },
    marks: { type: Number, default: 1 },
    explanation: { type: String },
    source: { type: String, enum: ["MANUAL", "AI"], default: "MANUAL" },
  },
  { _id: false }
);

const QuestionPaperSchema = new mongoose.Schema(
  {
    paperType: { type: String, required: true },
    questions: { type: [QuestionSchema], default: [] },
  },
  { _id: false }
);

const TestSchema = new mongoose.Schema(
  {
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    slug: { type: String, unique: true, index: true },
    name: { type: String, required: true, trim: true },
    description: { type: String, default: "" },

    durationMinutes: { type: Number, required: true },
    totalMarks: { type: Number, required: true },

    // Final questions each participant will receive.
    totalQuestionsToShow: {
      type: Number,
      required: true,
    },

    // Number of unique pre-generated papers (A/B/C...).
    questionPaperCount: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },

    questionType: {
      type: String,
      enum: ["MCQ", "SENTENCE", "MIXED"],
      required: true,
    },

    // Master pool (includes 50% extra questions).
    questions: { type: [QuestionSchema], default: [] },

    // Pre-generated shuffled papers to be assigned at attempt start.
    questionPapers: { type: [QuestionPaperSchema], default: [] },
  },
  { timestamps: true }
);

TestSchema.index({ ownerId: 1, createdAt: -1 });

module.exports = mongoose.model("Test", TestSchema);
