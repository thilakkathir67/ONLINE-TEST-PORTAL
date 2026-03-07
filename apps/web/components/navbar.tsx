"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "./logo";
import { clearToken, getToken } from "../lib/auth";

const NavLink = ({ href, label }: { href: string; label: string }) => (
  <Link
    href={href}
    className="rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
  >
    {label}
  </Link>
);

export function Navbar() {
  const [loggedIn, setLoggedIn] = useState(false);
  const router = useRouter();

  function syncAuth() {
    const token = getToken();
    setLoggedIn(!!token);
  }

  useEffect(() => {
    syncAuth();

    window.addEventListener("auth-changed", syncAuth);

    return () => {
      window.removeEventListener("auth-changed", syncAuth);
    };
  }, []);

  useEffect(() => {
    const prefetch = () => {
      router.prefetch("/login");
      router.prefetch("/join");
      router.prefetch("/create");
      router.prefetch("/dashboard");
    };

    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };

    if (typeof w.requestIdleCallback === "function") {
      const id = w.requestIdleCallback(prefetch);
      return () => {
        if (typeof w.cancelIdleCallback === "function") {
          w.cancelIdleCallback(id);
        }
      };
    }

    const t = window.setTimeout(prefetch, 400);
    return () => window.clearTimeout(t);
  }, [router]);

  function logout() {
    clearToken();
    setLoggedIn(false);
    router.push("/");
  }

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-navy-950/50 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Logo />
          <span className="text-sm font-semibold tracking-wide">TestPortal</span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          <NavLink href="/" label="Home" />
          <NavLink href="/create" label="Create Test" />

          {loggedIn ? (
            <button
              onClick={logout}
              className="rounded-xl px-3 py-2 text-sm font-medium text-white/75 transition hover:bg-white/10 hover:text-white"
            >
              Logout
            </button>
          ) : (
            <NavLink href="/login" label="Login" />
          )}
        </nav>

        <div className="sm:hidden flex items-center gap-2">
  <Link
    href="/"
    className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
  >
    Home
  </Link>

  {loggedIn ? (
    <button
      onClick={logout}
      className="rounded-2xl border border-white/20 px-4 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
    >
      Logout
    </button>
  ) : (
    <Link
  href="/login"
  className="rounded-2xl bg-white/10 px-4 py-2 text-sm font-medium text-white hover:bg-white/15"
>
  Login
</Link>

  )}
</div>


      </div>
    </header>
  );
}
