"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { login } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);
    startTransition(() => {
      login(email, password)
        .then((result) => {
          if (result.success) {
            router.push("/");
            router.refresh();
          } else {
            setMessage(result.message);
          }
        })
        .catch((error) => {
          console.error("Login failed", error);
          setMessage("Unable to sign in right now.");
        });
    });
  };

  return (
    <div className="mx-auto w-full max-w-md rounded-xl border border-slate-800 bg-slate-900/60 p-8 shadow-lg">
      <h1 className="text-2xl font-semibold text-white">Sign in</h1>
      <p className="mt-2 text-sm text-slate-400">Use your registered email to access personal watchlists.</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <label className="flex flex-col text-sm text-slate-200">
          Email
          <input
            type="email"
            className="mt-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
          />
        </label>
        <label className="flex flex-col text-sm text-slate-200">
          Password
          <input
            type="password"
            className="mt-1 rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-white focus:border-sky-500 focus:outline-none"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
          />
        </label>
        <Button type="submit" className="w-full" disabled={pending}>
          {pending ? "Signing in…" : "Sign in"}
        </Button>
        {message && <p className="text-sm text-red-400">{message}</p>}
      </form>
      <p className="mt-6 text-xs text-slate-400">
        Don&apos;t have an account?{" "}
        <Link href="/register" className="text-sky-300 hover:text-sky-200">
          Create one
        </Link>
      </p>
    </div>
  );
}
