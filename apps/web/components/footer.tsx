import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-auto border-t border-white/10 bg-navy-950/40 backdrop-blur">
      <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-10 text-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="text-white/60">(c) {new Date().getFullYear()} TestPortal</div>
        <div className="flex flex-wrap gap-4">
          <Link className="text-white/60 hover:text-white" href="/">
            Product
          </Link>
          <Link className="text-white/60 hover:text-white" href="/create">
            Create
          </Link>
          <Link className="text-white/60 hover:text-white" href="/join">
            Join
          </Link>
          <Link className="text-white/60 hover:text-white" href="/dashboard">
            Dashboard
          </Link>
        </div>
      </div>
    </footer>
  );
}
