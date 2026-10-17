import Link from "next/link";
export default function Page() {
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/" className="text-cyan-400 hover:underline text-sm">← Home</Link>
      <h1 className="mt-3 text-4xl font-bold">Privacy Policy</h1>
      <p className="mt-4 text-slate-400">This page is under construction. Please contact us at <a href="mailto:legal@founderpilot.ai" className="text-cyan-400 hover:underline">legal@founderpilot.ai</a> for the current Privacy Policy.</p>
      <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-200">
        <p className="font-bold">Last Updated: September 10, 2026</p>
        <p className="mt-2">FounderPilot AI is committed to compliance with US federal and state laws. Our full Privacy Policy will be published here soon. In the meantime, all services operate under our standard terms and privacy practices.</p>
      </div>
    </main>
  );
}
