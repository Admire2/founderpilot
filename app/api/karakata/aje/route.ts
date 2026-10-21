import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const email = String(b.email || "").toLowerCase();

    if (b.action === "consent") {
      const { error } = await sb.from("kara_consents").upsert({
        email: email,
        consent_inventory: !!b.consent_inventory,
        consent_funding: !!b.consent_funding,
        consent_bi: !!b.consent_bi,
        granted_at: new Date().toISOString(), revoked_at: null
      }, { onConflict: "email" });
      if (error) return NextResponse.json({ ok: false, error: String(error.message) }, { status: 500 });
      return NextResponse.json({ ok: true, note: "Consent saved. Optional and revocable anytime." });
    }

    if (b.action === "report") {
      const { data: sellers } = await sb.from("sellers").select("*").eq("email", email).limit(1);
      const seller = sellers && sellers[0];
      if (!seller) return NextResponse.json({ ok: false, error: "Register as a seller first at /karakata/sell" }, { status: 404 });
      const { data: listings } = await sb.from("kara_listings").select("*").eq("seller_id", seller.id);
      const { data: inv } = await sb.from("kara_inventory").select("*").eq("seller_id", seller.id);
      const { data: cons } = await sb.from("kara_consents").select("*").eq("email", email).limit(1);
      const { data: scores } = await sb.from("kara_scores").select("*").eq("seller_id", seller.id).order("created_at", { ascending: false }).limit(1);
      const stockouts = (inv || []).filter((r: any) => Number(r.stock_qty) <= Number(r.reorder_point));
      return NextResponse.json({ ok: true, seller, listings: listings || [], inventory: inv || [], consent: (cons && cons[0]) || null, score: (scores && scores[0]) || null, stockouts });
    }

    if (b.action === "score") {
      const { data: sellers } = await sb.from("sellers").select("*");
      const { data: listings } = await sb.from("kara_listings").select("*");
      const { data: inv } = await sb.from("kara_inventory").select("*");
      const { data: reqs } = await sb.from("kara_requests").select("*");
      const { data: consents } = await sb.from("kara_consents").select("*");
      const period = new Date().toISOString().slice(0, 7);
      const results: any[] = [];
      for (const s of sellers || []) {
        const my = (listings || []).filter((l: any) => l.seller_id === s.id);
        const myInv = (inv || []).filter((r: any) => r.seller_id === s.id);
        const demand = (reqs || []).filter((r: any) => r.category === s.category).length;
        const stock = myInv.reduce((a: number, r: any) => a + (Number(r.stock_qty) || 0), 0);
        const consent = (consents || []).find((c: any) => c.email === s.email);
        const velocity = Math.min(100, my.length * 12 + stock / 4);
        const reliability = Math.min(100, (myInv.length ? 40 : 10) + (consent && consent.consent_inventory ? 30 : 0) + demand * 6);
        const growth = Math.min(100, demand * 15 + my.length * 8);
        let tier = "Watchlist";
        if (my.length >= 2 && consent && consent.consent_funding) tier = "Emerging";
        if (my.length >= 3 && demand >= 2 && consent && consent.consent_funding && stock > 0) tier = "Fund-ready";
        const { data: prev } = await sb.from("kara_scores").select("tier").eq("seller_id", s.id).order("created_at", { ascending: false }).limit(1);
        const wasTier = prev && prev[0] ? prev[0].tier : "Watchlist";
        await sb.from("kara_scores").insert({ seller_id: s.id, period, velocity_score: velocity, reliability_score: reliability, growth_score: growth, tier, notes: "listings:" + my.length + " stock:" + stock + " demand:" + demand });
        if (tier === "Fund-ready" && wasTier !== "Fund-ready" && consent && consent.consent_funding) {
          const admin = process.env.ADMIN_EMAIL || "greatmind20+level3@gmail.com";
          await sb.from("kara_emails").insert({ email: admin, kind: "funding_alert", subject: "Aje: " + s.shop_name + " just reached FUND-READY tier", body: "<p>Seller " + s.shop_name + " (" + s.email + ") crossed into Fund-ready: " + my.length + " live listings, " + stock + " units stocked, " + demand + " buyer requests in category. Consent for funding outreach: YES. Prepare investor one-pager.</p>", status: "queued", send_at: new Date().toISOString() });
          await sb.from("kara_emails").insert({ email: s.email, kind: "funding_offer", subject: s.shop_name + ", you are pre-qualified for expansion capital (optional)", body: "<p>Congratulations - your KaraKata performance has pre-qualified you for expansion capital from FounderPilot or vetted lending / VC / angel partners.</p><p><b>This is entirely optional.</b> Reply ONLY if you want to explore terms. Declining never affects your storefront, rankings or fees.</p><p>- Aje, Growth & Funding Intelligence Agent</p>", status: "queued", send_at: new Date().toISOString() });
        }
        results.push({ shop: s.shop_name, email: s.email, tier, velocity, reliability, growth });
      }
      return NextResponse.json({ ok: true, period, results });
    }
    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
export async function GET() {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data: scores } = await sb.from("kara_scores").select("*").order("created_at", { ascending: false }).limit(50);
  const tiers: any = {};
  (scores || []).forEach((s: any) => { tiers[s.tier] = (tiers[s.tier] || 0) + 1; });
  return NextResponse.json({ ok: true, tiers, recent: scores || [] });
}
