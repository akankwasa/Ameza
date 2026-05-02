"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserRole } from "@/types/enums";

const ROLE_REDIRECTS: Record<UserRole, string> = {
  client: "/client/dashboard",
  cleaner: "/cleaner/dashboard",
  admin: "/admin/jobs",
};

// ─── Shared visual constants ───────────────────────────────────────────────

const INPUT =
  "block w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none transition focus:border-gray-400 focus:ring-2 focus:ring-gray-900/10";

const BTN_PRIMARY =
  "flex w-full items-center justify-center gap-2 rounded-xl bg-gray-900 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-gray-800 active:bg-gray-950 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const BTN_GHOST =
  "flex w-full items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-600 transition hover:border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

// ─── Micro-components ─────────────────────────────────────────────────────

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 0 1 8-8V0C5.373 0 0 5.373 0 12h4z" />
    </svg>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loadingPassword, setLoadingPassword] = useState(false);
  const [loadingMagicLink, setLoadingMagicLink] = useState(false);
  const [magicLinkSent, setMagicLinkSent] = useState(false);

  const busy = loadingPassword || loadingMagicLink;

  async function handlePasswordSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoadingPassword(true);
    setError(null);

    const supabase = createClient();
    const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoadingPassword(false);
      return;
    }

    const userId = authData.user.id;
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .maybeSingle();

    // Prefer profiles table role; fall back to JWT metadata for manually-created
    // admin accounts that may not have a profiles row yet.
    const role =
      (profile?.role as UserRole | undefined) ??
      (authData.user.user_metadata?.role as UserRole | undefined);

    if (!role || !ROLE_REDIRECTS[role]) {
      setError("Account role not recognised. Please contact support.");
      setLoadingPassword(false);
      return;
    }

    router.push(ROLE_REDIRECTS[role]);
  }

  async function handleMagicLink() {
    if (!email.trim()) {
      setError("Enter your email address above before sending a magic link.");
      return;
    }
    setLoadingMagicLink(true);
    setError(null);

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({ email });

    if (otpError) {
      setError(otpError.message);
      setLoadingMagicLink(false);
      return;
    }

    setMagicLinkSent(true);
    setLoadingMagicLink(false);
  }

  return (
    <div className="w-full max-w-md">
      <div className="rounded-2xl bg-white px-8 py-10 shadow-[0_2px_24px_rgba(0,0,0,0.07)]">

        {/* Wordmark */}
        <p className="mb-8 text-xl font-bold tracking-tight text-gray-900">Ameza</p>

        <div className="mb-7">
          <h1 className="text-2xl font-semibold tracking-tight text-gray-900">Welcome back</h1>
          <p className="mt-1.5 text-sm text-gray-500">Sign in to your account</p>
        </div>

        <form onSubmit={handlePasswordSignIn} noValidate className="space-y-4">
          {/* Email */}
          <div>
            <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-gray-700">
              Email address
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="jane@example.com"
              className={INPUT}
            />
          </div>

          {/* Password */}
          <div>
            <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Your password"
              className={INPUT}
            />
          </div>

          {/* Inline error */}
          {error && (
            <p role="alert" className="rounded-xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-600">
              {error}
            </p>
          )}

          <button type="submit" disabled={busy} className={BTN_PRIMARY}>
            {loadingPassword ? (
              <>
                <Spinner />
                Signing in…
              </>
            ) : (
              "Sign in"
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-5">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-100" />
          </div>
          <div className="relative flex justify-center">
            <span className="bg-white px-3 text-xs text-gray-400">or</span>
          </div>
        </div>

        {/* Magic link */}
        {magicLinkSent ? (
          <div className="rounded-xl border border-emerald-100 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            Check your inbox — we sent a magic link to{" "}
            <strong className="font-semibold">{email}</strong>.
          </div>
        ) : (
          <button type="button" onClick={handleMagicLink} disabled={busy} className={BTN_GHOST}>
            {loadingMagicLink ? (
              <>
                <Spinner />
                Sending…
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 text-gray-400">
                  <path d="M3 4a2 2 0 0 0-2 2v1.161l8.441 4.221a1.25 1.25 0 0 0 1.118 0L19 7.162V6a2 2 0 0 0-2-2H3Z" />
                  <path d="m19 8.839-7.77 3.885a2.75 2.75 0 0 1-2.46 0L1 8.839V14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V8.839Z" />
                </svg>
                Continue with magic link
              </>
            )}
          </button>
        )}

        <p className="mt-8 text-center text-sm text-gray-500">
          Don&apos;t have an account?{" "}
          <a href="/register" className="font-semibold text-gray-900 hover:underline">
            Sign up
          </a>
        </p>
      </div>
    </div>
  );
}
