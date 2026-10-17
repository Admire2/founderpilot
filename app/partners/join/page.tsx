"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
export default function JoinPage() {
  const [f, setF] = useState<any>({ company: "", country: "", city: "", category: "", website: "", contact_email: "", model_preference: "lead-fee", notes: "" });
  const [done, setDone] = useState(false);
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const inp = "mt-1 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200";
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold">🤝 Render services on FounderPilot infrastructure</h1>
        <p className="mt-2 text-sm text-slate-400">Suppliers, assemblers, manufacturers: get design-ready clients routed to you. No affiliate program needed — choose how we earn together.</p>
        {done ? <p className="mt-6 text-emerald-300 font-bold">Application received — our partnerships team will contact you.</p> : (
          <div className="mt-6 space-y-3">
            <label className="block text-xs font-bold text-cyan-300">Company<input className={inp} value={f.company} onChange={set("company")} /></label>
            <label className="block text-xs font-bold text-cyan-300">Country<input className={inp} value={f.country} onChange={set("country")} /></label>
            <label className="block text-xs font-bold text-cyan-300">City<input className={inp} value={f.city} onChange={set("city")} /></label>
            <label className="block text-xs font-bold text-cyan-300">Category (pcb / cnc / assembly / components / electronics / civil)<input className={inp} value={f.category} onChange={set("category")} /></label>
            <label className="block text-xs font-bold text-cyan-300">Website<input className={inp} value={f.website} onChange={set("website")} /></label>
            <label className="block text-xs font-bold text-cyan-300">Contact email<input className={inp} value={f.contact_email} onChange={set("contact_email")} /></label>
            <label className="block text-xs font-bold text-cyan-300">Partnership model
              <select className={inp} value={f.model_preference} onChange={set("model_preference")}>
                <option value="lead-fee">Lead fee (pay per qualified intro)</option>
                <option value="platform-fee">Platform fee (% per tracked order)</option>
                <option value="revenue-share">Revenue share</option>
                <option value="affiliate">Affiliate commission</option>
              </select>
            </label>
            <label className="block text-xs font-bold text-cyan-300">Capabilities / notes<textarea className={inp} rows={3} value={f.notes} onChange={set("notes")} /></label>
            <button className="w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-900" onClick={async () => { await supabase.from("partner_applications").insert(f); setDone(true); }}>Apply</button>
          </div>
        )}
      </div>
    </main>
  );
}
