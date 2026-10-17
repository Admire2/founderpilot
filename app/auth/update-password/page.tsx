"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isValidSession, setIsValidSession] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const checkSession = async () => {
      // Supabase automatically parses the #access_token from the URL on load
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        setError("Invalid or expired recovery link. Please request a new password reset.");
        setIsValidSession(false);
      } else {
        setIsValidSession(true);
      }
    };
    checkSession();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidSession) return;
    
    setLoading(true);
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setLoading(false);
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
    } else {
      setMessage("Password updated successfully! Redirecting to sign in...");
      setTimeout(() => {
        // Force a hard reload to clear any stale auth state, then redirect
        window.location.href = "/auth";
      }, 2000);
    }
    setLoading(false);
  };

  if (!isValidSession && !loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl text-center">
          <h2 className="text-2xl font-bold text-red-400 mb-4">Link Expired or Invalid</h2>
          <p className="text-slate-400 mb-6">This password reset link is no longer valid. Please request a new one.</p>
          <a 
            href="/auth/forgot-password" 
            className="inline-block bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-6 rounded-md transition"
          >
            Request New Reset Link
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 max-w-md w-full shadow-2xl">
        <h2 className="text-2xl font-bold text-white mb-2">Set New Password</h2>
        <p className="text-slate-400 mb-6 text-sm">Enter your new password to regain access to your account.</p>

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

        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">New Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Enter new password (min 6 chars)"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirm Password</label>
            <input
              type="password"
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 bg-slate-900 border border-slate-600 rounded-md text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-cyan-500"
              placeholder="Confirm new password"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !isValidSession}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-md transition disabled:opacity-50"
          >
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
