import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Pill } from "../components/pill";


export default function HomePage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-14">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <Pill icon={<Sparkles size={16} />} text="AI-assisted question creation" />
          <h1 className="mt-4 text-4xl font-semibold tracking-tight sm:text-5xl">
            Modern Online Test Portal
            <span className="text-neon-500">.</span>
          </h1>
          <p className="mt-4 max-w-xl text-white/70">
            Create tests in minutes, mix manual + AI-generated questions, share a link, and get instant results.
             login required to create Tests.
          </p>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/create"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-neon-500 px-5 py-3 font-medium text-navy-950 shadow-soft transition hover:opacity-90"
            >
              Create a Test <ArrowRight size={18} />
            </Link>
            <Link
              href="/join"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-white/5 px-5 py-3 font-medium text-white transition hover:bg-white/10"
            >
              Join a Test <ArrowRight size={18} />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {[
              { k: "No Lags", v: "Create & join instantly" },
              { k: "Share link", v: "Unique test URL" },
              { k: "Analytics", v: "Scores & insights" },
            ].map((x) => (
              <div key={x.k} className="card-glass rounded-2xl p-4">
                <div className="text-sm text-white/60">{x.k}</div>
                <div className="mt-1 font-semibold">{x.v}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="card-glass rounded-3xl p-6 shadow-soft">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-white/60">Preview</div>
              <div className="text-lg font-semibold">Test Builder</div>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs text-white/70">
              Navy Gradient UI
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {[
              { label: "Test name", value: "DSA Weekly Mock" },
              { label: "Duration", value: "30 minutes" },
              { label: "Questions", value: "10 (Mixed)" },
            ].map((row) => (
              <div key={row.label} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <div className="text-xs text-white/60">{row.label}</div>
                <div className="mt-1 font-medium">{row.value}</div>
              </div>
            ))}

            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-xs text-white/60">AI generation</div>
              <div className="mt-1 text-sm text-white/70">
                Select topic + difficulty → generate instantly → edit & mix with manual questions.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
