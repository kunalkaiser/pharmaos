"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/app";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          password,
        }),
      });

      const payload = await response.json().catch(() => null);

      if (!response.ok) {
        setError(payload?.error || "Login failed. Check your email and password.");
        return;
      }

      router.push(next);
      router.refresh();
    } catch {
      setError("Login failed because the server could not be reached.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-8 space-y-5">
      <label className="block">
        <span className="text-sm font-medium text-slate-700">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-slate-700">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-950 outline-none transition focus:border-cyan-600 focus:ring-4 focus:ring-cyan-100"
          placeholder="Enter your password"
        />
      </label>

      {error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-950/20 transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Signing in..." : "Sign in to workspace"}
      </button>
    </form>
  );
}

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex min-h-[80vh] max-w-6xl items-center justify-center">
        <div className="grid w-full overflow-hidden rounded-[2rem] border border-white/10 bg-white/[0.04] shadow-2xl shadow-slate-950/60 md:grid-cols-[1.05fr_0.95fr]">
          <section className="border-b border-white/10 bg-[radial-gradient(circle_at_top_left,rgba(56,189,248,0.24),transparent_34%),linear-gradient(135deg,rgba(15,23,42,0.92),rgba(15,23,42,0.72))] p-8 md:border-b-0 md:border-r md:p-12">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-300">
              EvidaraOS private workspace
            </p>
            <h1 className="mt-5 max-w-xl text-4xl font-semibold tracking-tight text-white md:text-5xl">
              Sign in to the evidence intelligence workspace.
            </h1>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-300">
              This area is for internal review of real public-source evidence candidates,
              provenance trails, reviewed records, reports, and audit-controlled workflows.
            </p>

            <div className="mt-8 rounded-2xl border border-cyan-300/20 bg-cyan-300/10 p-5 text-sm leading-6 text-cyan-50">
              <p className="font-semibold text-cyan-200">Access boundary</p>
              <p className="mt-2 text-cyan-50/85">
                No public user can access the product workspace without an authenticated session.
                Evidence retrieval, review, scoring, and reports remain internal protected workflows.
              </p>
            </div>

            <div className="mt-8 grid gap-3 text-sm text-slate-300">
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                Real public-source candidates only
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                Query audit trail and provenance-first workflow
              </div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                Reviewed evidence required before reports or scoring
              </div>
            </div>
          </section>

          <section className="bg-slate-50 p-8 text-slate-950 md:p-12">
            <div className="mx-auto max-w-md">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                Authenticated access
              </p>
              <h2 className="mt-3 text-3xl font-semibold tracking-tight">Log in</h2>
              <p className="mt-3 text-sm leading-6 text-slate-600">
                Use the real user created in your local database. No demo accounts or fake users are used.
              </p>

              <Suspense
                fallback={
                  <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-600">
                    Loading login form...
                  </div>
                }
              >
                <LoginForm />
              </Suspense>

              <p className="mt-6 text-center text-xs leading-5 text-slate-500">
                This is real authentication against the configured database-backed auth system.
                Do not use shared demo credentials.
              </p>

              <div className="mt-8 text-center">
                <Link href="/" className="text-sm font-semibold text-cyan-700 hover:text-cyan-900">
                  Return to public EvidaraOS site
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
