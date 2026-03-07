"use client";

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: ErrorProps) {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 text-center">
      <h1 className="text-3xl font-semibold tracking-tight">Something went wrong</h1>
      <p className="mt-3 text-white/70">{error.message || "Unexpected error"}</p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 rounded-xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/15"
      >
        Try again
      </button>
    </div>
  );
}
