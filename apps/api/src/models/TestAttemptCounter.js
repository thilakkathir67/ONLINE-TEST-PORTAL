const mongoose = require("mongoose");

/**
 * Atomic per-test counter used to allocate question papers fairly under concurrency.
 * Using a counter avoids race conditions from "count then choose" approaches.
 */
const TestAttemptCounterSchema = new mongoose.Schema(
  {
    testId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Test",
      required: true,
      unique: true,
      index: true,
    },

    // Next sequence number to allocate (monotonically increasing).
    next: { type: Number, default: 0 },

    // Stable random offset so paper allocation doesn't always start at index 0.
    offset: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("TestAttemptCounter", TestAttemptCounterSchema);

