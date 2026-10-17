import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  if (id) {
    const { data } = await sb.from("kara_listings").select("*, kara_sellers(shop_name, whatsapp, phone, city)").eq("id", Number(id)).single();
    const { data: rel } = await sb.from("kara_listings").select("*").eq("category", (data && data.category) || "").neq("id", Number(id)).limit(4);
    return NextResponse.json({ ok: true, item: data || null, related: rel || [] });
  }
  const { data } = await sb.from("kara_listings").select("*, kara_sellers(shop_name, whatsapp, phone, city)").eq("status", "active").order("created_at", { ascending: false }).limit(60);
  const cons = await sb.from("kara_consents").select("email").eq("consent_inventory", true);
    const consSet = new Set((cons.data || []).map((c: any) => c.email));
    const items = (data || []).map((l: any) => {
      const s = l.kara_sellers;
      const badges: string[] = [];
      if (Number(l.lead_time_days) <= 3) badges.push("Fast");
      if (s && s.status === "active") badges.push("Verified");
      if (s && s.created_at && (Date.now() - new Date(s.created_at).getTime()) < 180 * 86400000) badges.push("Founding");
      if (s && s.email && consSet.has(s.email)) badges.push("Data-Shared");
      return Object.assign({}, l, { badges: badges });
    });
    return NextResponse.json({ ok: true, items: items });
}
