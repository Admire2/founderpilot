import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export default async function GoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data } = await sb.from("qr_links").select("*").eq("slug", slug).single();
  if (!data) return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <div className="text-center"><h1 className="text-4xl font-bold">Link Not Found</h1><p className="mt-4 text-slate-400">This QR code is invalid or expired.</p></div>
    </div>
  );
  try { await sb.from("qr_links").update({ scans: (data.scans || 0) + 1 }).eq("slug", slug); } catch (e) {}
  const meta = (data.meta || {}) as any;
  const location = [meta.city, meta.country].filter(Boolean).join(", ");
  const socials = [
    meta.facebook ? { label: "Facebook", url: meta.facebook, cls: "bg-blue-600 hover:bg-blue-500" } : null,
    meta.instagram ? { label: "Instagram", url: meta.instagram, cls: "bg-pink-600 hover:bg-pink-500" } : null,
    meta.tiktok ? { label: "TikTok", url: meta.tiktok, cls: "bg-black border border-white/20 hover:bg-slate-800" } : null,
  ].filter(Boolean) as any[];

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-6">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 text-center shadow-2xl backdrop-blur">
        <h1 className="text-4xl font-extrabold tracking-tight text-white">{data.business}</h1>
        <p className="mt-2 text-xs uppercase tracking-widest text-slate-500">Official Business Page</p>
        {location && <p className="mt-1 text-sm text-slate-400">📍 {location}</p>}
        {socials.length > 0 && (
          <div className="mt-6 space-y-3">
            {socials.map((s) => <a key={s.label} href={s.url} target="_blank" className={"block w-full rounded-xl px-6 py-3 font-bold text-white " + s.cls}>{s.label}</a>)}
          </div>
        )}
        <div className="mt-4 space-y-3">
          {meta.website && <a href={meta.website} target="_blank" className="block w-full rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-400">Visit Website</a>}
          {meta.phone && <a href={"tel:" + meta.phone} className="block w-full rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-400">Call Now: {meta.phone}</a>}
          {meta.email && <a href={"mailto:" + meta.email} className="block w-full rounded-xl bg-blue-500 px-6 py-3 font-bold text-white hover:bg-blue-400">Send Email: {meta.email}</a>}
        </div>
        {meta.message && <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">{meta.message}</div>}
        <p className="mt-8 text-[10px] uppercase tracking-widest text-slate-600">Powered by FounderPilot</p>
      </div>
    </div>
  );
}