import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json(); if (!b.total_usd && b.total) b.total_usd = b.total; if (!b.total && b.total_usd) b.total = b.total_usd; if (!b.email && b.buyer_email) b.email = b.buyer_email; if (!b.buyer_email && b.email) b.buyer_email = b.email;
    try { const base = process.env.VERCEL_URL ? ("https://" + process.env.VERCEL_URL) : "https://founderpilot-theta.vercel.app"; await fetch(base + "/api/karakata/tunde", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: b.order_id || b.id, status: b.status || "placed", email: b.email || b.buyer_email || "" }) }); } catch (e) {}
    const items = ((Array.isArray(b.items) && b.items.length) ? b.items : (b.listing_id ? [{ id: b.listing_id, listing_id: b.listing_id, seller_id: b.seller_id, qty: b.qty || 1, unit_price: b.unit_price, price_usd: b.unit_price, title: "order item" }] : [])).map((it: any) => ({ ...it, price: it.price || it.price_usd || it.unit_price || 0 }));
    if (!items.length) return NextResponse.json({ ok: false, error: "Cart is empty." }, { status: 400 });
    const email = String(b.email || "").toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Email required." }, { status: 400 });
    const total = items.reduce((s: number, it: any) => s + (Number(it.price) || 0) * (Number(it.qty) || 1), 0);
    const code = "KK-" + Date.now().toString(36).toUpperCase();
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { error } = await sb.from("kara_orders").insert({ code, buyer_email: email, buyer_name: b.buyer_name || null, buyer_phone: b.phone || null, address: b.address || null, payment: b.payment || "cod", items, total_usd: total, status: "placed" });
    if (error) return NextResponse.json({ ok: false, error: String(error.message) }, { status: 500 });
    const rows = items.map((it: any) => "<tr><td style='padding:6px;border:1px solid #eee'>" + (it.title || "Item") + "</td><td style='padding:6px;border:1px solid #eee'>" + (it.qty || 1) + "</td><td style='padding:6px;border:1px solid #eee'>$" + (Number(it.price) * (it.qty || 1)).toFixed(2) + "</td></tr>").join("");
    const html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'><h2 style='color:#d97706'>Order " + code + " confirmed</h2><p>Hi " + (b.buyer_name || "friend") + ", I am <b>Tunde</b>, your order agent at KaraKata. Your order is placed and the seller has been notified.</p><table style='width:100%;border-collapse:collapse'><tr><th style='padding:6px;border:1px solid #eee;text-align:left'>Item</th><th style='padding:6px;border:1px solid #eee'>Qty</th><th style='padding:6px;border:1px solid #eee'>Amount</th></tr>" + rows + "<tr><td colspan='2' style='padding:6px;border:1px solid #eee;text-align:right'><b>Total</b></td><td style='padding:6px;border:1px solid #eee'><b>$" + total.toFixed(2) + "</b></td></tr></table><p><b>Payment:</b> " + (b.payment || "cod") + "<br/><b>Deliver to:</b> " + (b.address || "") + "</p><p>I will email you the moment the seller <b>accepts</b>, <b>ships</b> and <b>delivers</b> this order. Any problem? Reply to me or open a dispute via Contact & Support - Buyer Protection covers you.</p><p>- Tunde, KaraKata Order Agent<br/>FounderPilot AI</p></div>";
    await sb.from("kara_emails").insert({ email, kind: "order_confirm", subject: "KaraKata order " + code + " confirmed - Tunde is on it", body: html, status: "queued", send_at: new Date().toISOString() });
    return NextResponse.json({ ok: true, code });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
