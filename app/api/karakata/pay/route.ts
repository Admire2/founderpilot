import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import Stripe from "stripe";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json(); if (!b.buyer_email && b.email) b.buyer_email = b.email; if (!b.email && b.buyer_email) b.email = b.buyer_email; if (!b.buyer_name && b.name) b.buyer_name = b.name; if (!b.name && b.buyer_name) b.name = b.buyer_name; if (!b.buyer_phone && b.phone) b.buyer_phone = b.phone; if (!b.phone && b.buyer_phone) b.phone = b.buyer_phone; if (!b.address && b.delivery_address) b.address = b.delivery_address; if (!b.total_usd && b.total != null) b.total_usd = b.total; if (!b.total && b.total_usd != null) b.total = b.total_usd;
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ ok: false, error: "Stripe key missing on server" }, { status: 500 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) return NextResponse.json({ ok: false, error: "Cart is empty" }, { status: 400 });
    const total = Math.round(items.reduce((a: number, it: any) => a + Number(it.price || 0) * Number(it.qty || 1), 0) * 100);
    const sellerId = Number(b.seller_id || (items[0] && items[0].seller_id) || 0);
    let dest = ""; let fee = 0; let founding = true;
    if (sellerId) {
      const { data: seller } = await sb.from("sellers").select("*").eq("id", sellerId).single();
      if (seller && seller.stripe_account && seller.stripe_charges_enabled) {
        dest = String(seller.stripe_account);
        const months = (Date.now() - new Date(seller.created_at || Date.now()).getTime()) / (30 * 86400000);
        founding = months < 6;
        fee = founding ? 0 : Math.round(total * 0.08);
      }
    }
    const { data: order, error: oerr } = await sb.from("kara_orders").insert({ code: ("KK-" + Math.random().toString(36).slice(2, 10).toUpperCase()), 
      email: String(b.email || "").toLowerCase(), buyer_email: String(b.email || "").toLowerCase(), buyer_name: String(b.name || ""), address: String(b.address || ""),
      phone: String(b.phone || ""), items: items, total: (Number(total) > 0 ? Number(total) / 100 : items.reduce((a: number, x: any) => a + Number(x.price_usd != null ? x.price_usd : (x.it && x.it.price_usd)) * (x.qty || 1), 0)), seller_id: sellerId || null,
      status: "pending_payment", payout_status: "pending_payment", application_fee: fee / 100
    }).select().single();
    if (oerr || !order) return NextResponse.json({ ok: false, error: String((oerr && oerr.message) || "order insert failed") }, { status: 500 });
    const origin = String(b.origin || "https://founderpilot-theta.vercel.app");
    const session: any = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: items.map((it: any) => ({ price_data: { currency: "usd", unit_amount: Math.round(Number(it.price || 0) * 100), product_data: { name: String(it.title || "KaraKata item") } }, quantity: Number(it.qty || 1) })),
      payment_intent_data: dest ? { transfer_data: { destination: dest }, application_fee_amount: fee } : undefined,
      metadata: { order_id: String(order.id), seller_id: String(sellerId || ""), email: String(b.email || "") },
      success_url: origin + "/karakata/checkout?success=1&order=" + order.id,
      cancel_url: origin + "/karakata/checkout?cancelled=1"
    });
    return NextResponse.json({ ok: true, url: session.url, order_id: order.id, fee_cents: fee, founding: founding, destination: dest || "platform-hold" });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
