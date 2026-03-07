const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "/backend";

function wait(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const retries = [0, 250, 500];
  let lastError: unknown;
  const method = (init?.method || "GET").toUpperCase();
  const hasBody = init?.body !== undefined && init?.body !== null;
  const isMutation = method !== "GET" && method !== "HEAD";

  for (const delay of retries) {
    if (delay) await wait(delay);

    try {
      const headers = new Headers(init?.headers || {});
      if (hasBody && !headers.has("Content-Type")) {
        headers.set("Content-Type", "application/json");
      }

      const res = await fetch(`${API_BASE}${path}`, {
        ...init,
        headers,
        // Avoid bypassing browser cache for read requests.
        cache: isMutation ? "no-store" : "default",
      });

      const contentType = res.headers.get("content-type") || "";
      const isJson = contentType.includes("application/json");
      const data = isJson ? await res.json() : await res.text();

      if (!res.ok) {
        const message =
          typeof data === "object" && data && "message" in data
            ? String((data as { message?: string }).message || "Request failed")
            : "Request failed";
        throw new Error(message);
      }

      return data as T;
    } catch (e) {
      lastError = e;
      const isNetworkError = e instanceof TypeError;
      if (!isNetworkError || delay === retries[retries.length - 1]) {
        throw e;
      }
    }
  }

  throw (lastError instanceof Error ? lastError : new Error("Request failed"));
}
