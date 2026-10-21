import { createClient } from "@supabase/supabase-js";
import Link from "next/link";
export const dynamic = "force-dynamic";

function stars(n: number) { const f = Math.round(n); return "★".repeat(f) + "☆".repeat(5 - f); }

export default async function SellerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data: seller } = await sb.from("sellers").select("*").eq("id", id).single();
  const { data: reviews } = await sb.from("kara_reviews").select("*").eq("seller_id", id).order("created_at", { ascending: false });
  const list = reviews || [];
  if (!seller) return <main className="min-h-screen bg-slate-950 p-10 text-white">Seller not found.</main>;
  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <Link href="/karakata/sellers" className="text-sm text-cyan-400 hover:underline">← All sellers</Link>
      {seller.banner_headline && (<div className="mt-4 rounded-2xl p-6" style={{ background: seller.theme_color || "#0f766e" }}><p className="text-2xl font-bold text-white">{seller.banner_headline}</p>{seller.tagline && (<p className="mt-1 text-white/90">{seller.tagline}</p>)}</div>)} {seller.about_text && (<p className="mt-4 max-w-2xl text-sm text-slate-300">{seller.about_text}</p>)} <h1 className="mt-3 text-3xl font-bold">{seller.shop_name}</h1>
      <p className="mt-2 text-2xl text-yellow-400">{stars(Number(seller.avg_rating || 0))} <span className="text-lg text-white">{Number(seller.avg_rating || 0).toFixed(1)} · {seller.review_count || 0} verified reviews</span></p>
      <h2 className="mt-8 text-xl font-bold">Customer feedback</h2>
      {list.length === 0 && <p className="mt-3 text-slate-400">No reviews yet.</p>}
      {list.map((r: any) => (
        <div key={r.id} className="mt-4 rounded-xl border border-slate-800 bg-slate-900 p-4">
          <p className="text-yellow-400">{stars(r.stars)}</p>
          <p className="mt-1 text-sm text-slate-300">{r.comment || "Rated without comment."}</p>
          <p className="mt-2 text-xs text-slate-500">Verified purchase · Order #{r.order_id} · {new Date(r.created_at).toLocaleDateString()}</p>
        </div>
      ))}
    </main>
  );
}