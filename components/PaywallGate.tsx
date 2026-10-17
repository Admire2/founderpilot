"use client";
import Link from "next/link";

export default function PaywallGate({ toolName }: { toolName: string }) {
  return (
    <div className="rounded-2xl border border-cyan-500/30 bg-gradient-to-br from-cyan-500/10 to-slate-900/50 p-8 md:p-12 text-center shadow-xl">
      <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-cyan-500/20 text-cyan-400 mb-6">
        <svg className="h-8 w-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      </div>
      <h2 className="text-2xl md:text-3xl font-bold text-white">
        You've used your 3 free reports!
      </h2>
      <p className="mt-4 text-slate-300 max-w-md mx-auto">
        You've reached the limit for the free tier on the {toolName}. Upgrade to <strong className="text-cyan-400">FounderPilot Pro</strong> to unlock unlimited AI generations, priority speed, and cloud history.
      </p>
      <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
        <Link
          href="/pricing"
          className="rounded-xl bg-cyan-500 px-8 py-4 text-lg font-semibold text-slate-950 transition hover:bg-cyan-400 shadow-lg shadow-cyan-500/20"
        >
          Upgrade to Pro ($9/mo)
        </Link>
      </div>
      <p className="mt-6 text-xs text-slate-500">
        Pro plan pays for itself with just one validated idea.
      </p>
      <div className="mt-8 rounded-xl border border-white/10 bg-white/5 p-5">
        <p className="text-sm text-slate-300">Not ready to upgrade yet?</p>
        <Link
          href="/auth"
          className="mt-3 inline-block rounded-xl border border-cyan-500/40 px-6 py-3 text-sm font-semibold text-cyan-300 hover:bg-cyan-500/10"
        >
          Create a free account - keep your 3 free reports
        </Link>
        <p className="mt-2 text-xs text-slate-500">Save your history and sync it on any device.</p>
      </div>
    </div>
  );
}