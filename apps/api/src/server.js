const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const dotenv = require("dotenv");

dotenv.config();

const { connectDb } = require("./utils/db");
const { errorHandler } = require("./middleware/errorHandler");

const authRoutes = require("./routes/auth.routes");
const testRoutes = require("./routes/test.routes");
const attemptRoutes = require("./routes/attempt.routes");
const aiRoutes = require("./routes/ai.routes");

const app = express();
app.disable("x-powered-by");
app.set("etag", "strong");

app.use(helmet());
app.use(express.json({ limit: "2mb" }));

app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000"],
    credentials: true,
  })
);

app.use(
  rateLimit({
    windowMs: 60 * 1000,
    max: 120,
  })
);

app.get("/", (_, res) =>
  res.json({ ok: true, service: "otp-api", message: "API is running" })
);

let dbConnected = false;
app.get("/health", (_, res) =>
  res.json({ ok: true, service: "otp-api", db: dbConnected ? "connected" : "connecting" })
);

app.use("/api/auth", authRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/attempts", attemptRoutes);
app.use("/api/ai", aiRoutes);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

async function connectWithRetry() {
  try {
    await connectDb();
    dbConnected = true;
  } catch (e) {
    dbConnected = false;
    console.error("DB connection failed. Retrying in 5s:", e.message || e);
    setTimeout(connectWithRetry, 5000);
  }
}

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
  connectWithRetry();
});
