"use client";

import { useState, useEffect, Suspense } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [mode, setMode] = useState("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);

  // Check if user is already signed in
  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setIsSignedIn(true);
        const callbackUrl = searchParams.get('callbackUrl') || '/karakata';
        router.push(callbackUrl);
      }
    };
    checkSession();
  }, [router, searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (mode === "signin") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Signed in successfully! Redirecting...");
        setTimeout(() => {
          const callbackUrl = searchParams.get('callbackUrl') || '/karakata';
          router.push(callbackUrl);
        }, 1000);
      }
    } else {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: typeof window !== 'undefined' ? window.location.origin + "/auth" : "" },
      });
      if (error) {
        setError(error.message);
      } else {
        setMessage("Account created! Check your email to confirm.");
      }
    }
    setLoading(false);
  };

  if (isSignedIn) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
          <div className="text-3xl mb-4">🔒</div>
          <h2 className="text-2xl font-bold text-white mb-2">Already Signed In</h2>
          <p className="text-slate-400 mb-4">Redirecting you to the marketplace...</p>
          <Link href="/karakata" className="text-cyan-400 hover:text-cyan-300">
            Go to KaraKata →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <div className="mb-6">
          <Link href="/" className="text-sm text-cyan-400 hover:text-cyan-300">
            ← Back
          </Link>
        </div>

        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">🚀</span>
          <h2 className="text-2xl font-bold text-white">FounderPilot Account</h2>
        </div>
        <p className="text-slate-400 mb-6 text-sm">
          One account for the entire FounderPilot Ecosystem: KaraKata Marketplace, Business Suite, Engineering Suite, Healthcare Suite, KAWS, and more.
        </p>

        <div className="flex gap-2 mb-6">
          <button
            type="button"
            onClick={() => { setMode("signin"); setError(""); setMessage(""); }}
            className={`flex-1 py-2 rounded-md font-semibold transition ${mode === "signin" ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setError(""); setMessage(""); }}
            className={`flex-1 py-2 rounded-md font-semibold transition ${mode === "signup" ? "bg-slate-700 text-white" : "bg-slate-900 text-slate-400 hover:text-white"}`}
          >
            Create Account
          </button>
        </div>

        {message && (
          <div className="bg-emerald-900/50 border border-emerald-500 text-emerald-300 px-4 py-3 rounded mb-4 text-sm">
            {message}
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 border border-red-500 text-red-300 px-4 py-3 rounded mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="you@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-transparent"
              placeholder="6+ characters"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-900 font-bold py-3 px-4 rounded-md transition disabled:opacity-50"
          >
            {loading ? "Processing..." : mode === "signin" ? "Sign In" : "Create Account & Send Confirmation"}
          </button>
        </form>

        {mode === "signin" && (
          <div className="mt-4 text-center">
            <Link href="/auth/forgot-password" className="text-sm text-cyan-400 hover:text-cyan-300">
              Forgot Password?
            </Link>
          </div>
        )}

        {mode === "signup" && (
          <p className="mt-4 text-xs text-slate-400 text-center">
            We email a confirmation link to verify you own this address — the same standard Amazon, eBay and Shopify use. Your credits, listings and orders attach to this account.
          </p>
        )}
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="text-white animate-pulse">Loading authentication...</div>
      </div>
    }>
      <AuthContent />
    </Suspense>
  );
}