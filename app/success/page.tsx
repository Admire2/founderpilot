"use client";
import Link from "next/link";

export default function SuccessPage() {
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center">
      <div className="max-w-md text-center bg-emerald-500/10 border border-emerald-500/30 p-10 rounded-2xl">
        <h1 className="text-3xl font-bold text-emerald-300 mb-4">Payment Successful! 🎉</h1>
        <p className="text-slate-300 mb-6">Your credits will appear in your wallet within seconds. Pia has emailed you a receipt.</p>
        <Link href="/suite" className="inline-block rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-400">Back to Suite</Link>
      </div>
    </main>
  );
}