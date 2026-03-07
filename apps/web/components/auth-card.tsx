"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../lib/api";
import { setToken } from "../lib/auth";
import { Button, Card, Divider, Input, Label } from "./ui";

export function AuthCard() {
  const [mode, setMode] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  async function submit() {
    setLoading(true);
    try {
      const path = mode === "login" ? "/api/auth/login" : "/api/auth/register";
      const body = mode === "login" ? { email, password } : { name, email, password };

      const data = await api<{ ok: true; token: string }>(path, {
        method: "POST",
        body: JSON.stringify(body),
      });

      setToken(data.token);
      router.push("/dashboard");
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <div className="text-2xl font-semibold tracking-tight">{mode === "login" ? "Login" : "Create account"}</div>
      <div className="mt-2 text-sm text-white/60">
        Login is optional. It enables saving tests & viewing analytics dashboard.
      </div>

      <Divider />

      {mode === "register" && (
        <div>
          <Label>Name</Label>
          <div className="mt-2">
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Your name" />
          </div>
        </div>
      )}

      <div className="mt-4">
        <Label>Email</Label>
        <div className="mt-2">
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@gmail.com" />
        </div>
      </div>

      <div className="mt-4">
        <Label>Password</Label>
        <div className="mt-2">
          <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
        </div>
      </div>

      <div className="mt-6">
        <Button onClick={submit} disabled={loading} className="w-full">
          {loading ? "Please wait..." : mode === "login" ? "Login" : "Register"}
        </Button>
      </div>

      <div className="mt-4 text-center text-sm text-white/60">
        {mode === "login" ? (
          <>
            Don&apos;t have an account?{" "}
            <button className="text-neon-500 hover:underline" onClick={() => setMode("register")}>
              Register
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button className="text-neon-500 hover:underline" onClick={() => setMode("login")}>
              Login
            </button>
          </>
        )}
      </div>
    </Card>
  );
}
