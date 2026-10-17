import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export default async function Page({ searchParams }: { searchParams: Promise<{ key?: string }> }) {
  const sp = await searchParams;
  if (!process.env.ADMIN_KEY || sp.key !== process.env.ADMIN_KEY) {
    return <main className="min-h-screen bg-slate-950 text-slate-400 flex items-center justify-center">404</main>;
  }
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const [{ data: pool }, { data: fin }, { data: records }, { data: tenants }] = await Promise.all([
    sb.from("kara_phone_pool").select("*, kara_tenants(name)").order("status", { ascending: true }),
    sb.from("kara_telecom_financials").select("*").single(),
    sb.from("kara_crm_records").select("*, kara_crm_contacts(contact_code, name, phone)").order("created_at", { ascending: false }).limit(25),
    sb.from("kara_tenants").select("*"),
  ]);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-8 space-y-8">
      <header>
        <h1 className="text-2xl font-bold">FounderPilot Ops</h1>
        <p className="text-sm text-slate-400">Telecom pool · financials · CRM intake</p>
      </header>

      <section className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          ["Total numbers", (fin as any)?.total_numbers ?? 0],
          ["Active", (fin as any)?.active_numbers ?? 0],
          ["Standby", (fin as any)?.standby_numbers ?? 0],
          ["Twilio cost/mo", "$" + ((fin as any)?.total_monthly_twilio_cost ?? 0)],
          ["Est. margin/mo", "$" + ((fin as any)?.estimated_net_margin ?? 0)],
        ].map(([label, val]) => (
          <div key={String(label)} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
            <div className="text-xs text-slate-400">{label}</div>
            <div className="text-xl font-semibold text-emerald-400">{val}</div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Number Pool</h2>
        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-sm">
            <thead className="bg-slate-900 text-slate-400">
              <tr><th className="p-3 text-left">Number</th><th className="p-3 text-left">Status</th><th className="p-3 text-left">Tenant</th><th className="p-3 text-left">Assigned</th><th className="p-3 text-left">Released</th></tr>
            </thead>
            <tbody>
              {(pool || []).map((n: any) => (
                <tr key={n.id} className="border-t border-slate-800">
                  <td className="p-3 font-mono">{n.phone_number}</td>
                  <td className="p-3"><span className={"px-2 py-1 rounded text-xs " + (n.status === "assigned" ? "bg-emerald-900 text-emerald-300" : n.status === "parked" ? "bg-amber-900 text-amber-300" : "bg-slate-800 text-slate-300")}>{n.status}</span></td>
                  <td className="p-3">{(n.kara_tenants && (n.kara_tenants as any).name) || "—"}</td>
                  <td className="p-3 text-slate-400">{n.last_assigned_at ? new Date(n.last_assigned_at).toLocaleDateString() : "—"}</td>
                  <td className="p-3 text-slate-400">{n.last_released_at ? new Date(n.last_released_at).toLocaleDateString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">CRM Intake Forms</h2>
        <div className="space-y-3">
          {(records || []).map((r: any) => (
            <div key={r.id} className="rounded-xl border border-slate-800 bg-slate-900 p-4">
              <div className="flex flex-wrap items-center gap-3 mb-2">
                <span className="font-mono text-emerald-400">{(r.kara_crm_contacts as any)?.contact_code}</span>
                <span className="text-slate-300">{(r.kara_crm_contacts as any)?.name || "Unknown caller"}</span>
                <span className="text-xs text-slate-500">{r.industry_id}</span>
                <span className="text-xs px-2 py-1 rounded bg-slate-800 text-slate-300">{r.status}</span>
                <span className="ml-auto text-xs text-slate-400">completeness {r.completeness}%</span>
              </div>
              <pre className="text-xs text-slate-400 whitespace-pre-wrap">{JSON.stringify(r.form_data, null, 2)}</pre>
              {r.summary && <p className="mt-2 text-xs text-slate-500 italic">{r.summary}</p>}
            </div>
          ))}
          {(!records || records.length === 0) && <p className="text-sm text-slate-500">No intake forms yet. Make a test call!</p>}
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-3">Tenants</h2>
        <ul className="text-sm text-slate-300 space-y-1">
          {(tenants || []).map((t: any) => (<li key={t.id} className="font-mono">{t.id} — {t.name} ({t.industry_id || "no industry"}) · ${t.monthly_fee}/mo</li>))}
        </ul>
      </section>
    </main>
  );
}