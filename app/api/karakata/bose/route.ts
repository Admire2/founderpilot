import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const action = String(b.action || "");

    if (action === "weekly_summary") {
      const { data: sellers } = await sb.from("kara_sellers").select("*");
      let queued = 0;
      for (const s of sellers || []) {
        if (!s.stripe_account || !s.email) continue;
        const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString();
        const { data: orders } = await sb.from("kara_orders")
          .select("*").eq("seller_id", s.id).eq("payout_status", "paid").gte("created_at", weekAgo);
        const paidOrders = orders || [];
        const totalSales = paidOrders.reduce((a: number, o: any) => a + Number(o.total || 0), 0);
        const totalFees = paidOrders.reduce((a: number, o: any) => a + Number(o.application_fee || 0), 0);
        if (paidOrders.length === 0) continue;
        await sb.from("kara_emails").insert({
          email: s.email, kind: "bose_weekly",
          subject: s.shop_name + ": your week in $" + totalSales.toFixed(2),
          body: "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'>" +
            "<h2 style='color:#0f766e'>📊 Weekly summary from Bose</h2>" +
            "<p>Hi " + s.shop_name + ",</p>" +
            "<p><b>Paid orders this week:</b> " + paidOrders.length + "</p>" +
            "<p><b>Total sales:</b> $" + totalSales.toFixed(2) + "</p>" +
            "<p><b>Fees taken:</b> $" + totalFees.toFixed(2) + "</p>" +
            "<p><b>Net to your bank:</b> $" + (totalSales - totalFees).toFixed(2) + "</p>" +
            "<p>Keep growing — Bose will ping you when your Aje funding tier moves.</p>" +
            "<p>- Bose, KaraKata Payout Agent</p></div>",
          status: "queued", send_at: new Date().toISOString()
        });
        queued++;
      }
      return NextResponse.json({ ok: true, sellers_summarized: queued });
    }

    if (action === "account_updated") {
      const acctId = String(b.account || "");
      const charges = !!b.charges_enabled;
      const payouts = !!b.payouts_enabled;
      const { data: seller } = await sb.from("kara_sellers")
        .update({ stripe_charges_enabled: charges, stripe_payouts_enabled: payouts })
        .eq("stripe_account", acctId).select().single();
      if (seller && payouts && seller.email) {
        await sb.from("kara_emails").insert({
          email: seller.email, kind: "bose_connect_ready",
          subject: seller.shop_name + ", your Stripe Connect is LIVE — you can now receive payouts",
          body: "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'>" +
            "<h2 style='color:#0f766e'>🎉 Connect is live</h2>" +
            "<p>Hi " + seller.shop_name + ", Bose here.</p>" +
            "<p>Your Stripe Connect account (" + acctId + ") is fully enabled for charges and payouts. Every delivered order will now auto-pay into your linked bank.</p>" +
            "<p>Founding-seller terms still apply: 0% fee for the first 6 months, then 8%.</p>" +
            "<p>- Bose, KaraKata Payout Agent</p></div>",
          status: "queued", send_at: new Date().toISOString()
        });
      }
      return NextResponse.json({ ok: true, seller: seller?.shop_name || null });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 });
  }
}
