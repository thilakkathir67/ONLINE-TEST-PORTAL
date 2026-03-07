const KEY = "otp_token";

function isJwtUsable(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return false;

    const base64 = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const normalized = base64 + "=".repeat((4 - (base64.length % 4)) % 4);
    const payload = JSON.parse(atob(normalized));

    // If exp is present, ensure token has not expired.
    if (typeof payload?.exp === "number") {
      return payload.exp * 1000 > Date.now();
    }

    return true;
  } catch {
    return false;
  }
}

export function setToken(token: string) {
  localStorage.setItem(KEY, token);
  window.dispatchEvent(new Event("auth-changed")); // 🔥 important
}

export function getToken() {
  if (typeof window === "undefined") return null;
  const token = localStorage.getItem(KEY);
  if (!token) return null;

  if (!isJwtUsable(token)) {
    localStorage.removeItem(KEY);
    return null;
  }

  return token;
}

export function clearToken() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("auth-changed")); // 🔥 important
}
