const router = require("express").Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { z } = require("zod");
const User = require("../models/User");

router.post("/register", async (req, res, next) => {
  try {
    const schema = z.object({
      name: z.string().min(2),
      email: z.string().email(),
      password: z.string().min(6),
    });
    const { name, email, password } = schema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const exists = await User.findOne({ email: normalizedEmail }).select("_id").lean();
    if (exists) return res.status(409).json({ ok: false, message: "Email already used" });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email: normalizedEmail, passwordHash });

    const token = jwt.sign({ userId: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ ok: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    next(e);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const schema = z.object({
      email: z.string().email(),
      password: z.string().min(1),
    });
    const { email, password } = schema.parse(req.body);
    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({ email: normalizedEmail }).select("name email passwordHash");
    if (!user) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ ok: false, message: "Invalid credentials" });

    const token = jwt.sign({ userId: user._id, email: user.email, name: user.name }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.json({ ok: true, token, user: { id: user._id, name: user.name, email: user.email } });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
