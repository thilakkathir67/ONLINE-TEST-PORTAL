import { clsx } from "clsx";
import React from "react";

/* ================= Card ================= */

export function Card({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={clsx(
        "card-glass rounded-3xl p-6 shadow-soft",
        className
      )}
    >
      {children}
    </div>
  );
}

/* ================= Input ================= */

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement>
) {
  return (
    <input
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none",
        "focus:border-neon-500/60 focus:ring-2 focus:ring-neon-500/20",
        props.className
      )}
    />
  );
}

/* ================= Textarea ================= */

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/35 outline-none",
        "focus:border-neon-500/60 focus:ring-2 focus:ring-neon-500/20",
        props.className
      )}
    />
  );
}

/* ================= Select ================= */

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement>
) {
  return (
    <select
      {...props}
      className={clsx(
        "w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none",
        "focus:border-neon-500/60 focus:ring-2 focus:ring-neon-500/20",
        "[&>option]:bg-white [&>option]:text-black",
        props.className
      )}
    />
  );
}

/* ================= Button ================= */

export function Button({
  variant = "primary",
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "danger";
}) {
  const base =
    "inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3 text-sm font-medium transition disabled:opacity-60";

  const styles =
    variant === "primary"
      ? "bg-neon-500 text-navy-950 hover:opacity-90"
      : variant === "danger"
      ? "bg-red-500/15 text-red-200 hover:bg-red-500/25 border border-red-500/20"
      : "bg-white/5 text-white hover:bg-white/10 border border-white/10";

  return (
    <button
      {...props}
      className={clsx(base, styles, className)}
    />
  );
}

/* ================= Label ================= */

export function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={clsx("text-xs font-medium text-white/60", className)}>
      {children}
    </div>
  );
}

/* ================= Divider ================= */

export function Divider({ className }: { className?: string }) {
  return (
    <div className={clsx("my-6 h-px w-full bg-white/10", className)} />
  );
}
