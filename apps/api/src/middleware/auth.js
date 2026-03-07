const jwt = require("jsonwebtoken");

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return res.status(401).json({ ok: false, message: "Missing token" });

  const token = header.split(" ")[1];
  if (!token) return res.status(401).json({ ok: false, message: "Invalid token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
    next();
  } catch (e) {
    return res.status(401).json({ ok: false, message: "Invalid token" });
  }
}

function authOptional(req, res, next) {
  const header = req.headers.authorization;
  if (!header) return next();

  const token = header.split(" ")[1];
  if (!token) return next();

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.user = payload;
  } catch (e) {
    // ignore invalid token
  }

  next();
}

module.exports = { authRequired, authOptional };
