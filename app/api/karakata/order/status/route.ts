import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
const MSG: Record<string, string> = {
  accepted: "great news - the seller accepted your order and is preparing it.",
  shipped: "your order is on the way! Track details are with the seller; expect delivery per the stated lead time.",
  delivered: "your order shows as delivered. Please check your items and confirm everything is as described.",
  cancelled: "this order was cancelled. Any payment made will be refunded per the Buyer Protection Policy."
};
export async function POST(req: Request) {
  try {
    const b = await req.json();
    try { const base = process.env.VERCEL_URL ? ("https://" + process.env.VERCEL_URL) : "https://founderpilot-theta.vercel.app"; await fetch(base + "/api/karakata/tunde", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: b.order_id || b.id, status: b.status || "placed", email: b.email || b.buyer_email || "" }) }); } catch (e) {}
    const status = String(b.status || "");
    if (!MSG[status]) return NextResponse.json({ ok: false, error: "Unknown status." }, { status: 400 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    const { data: rows } = await sb.from("kara_orders").select("*").eq("code", String(b.code || "")).limit(1);
    const order: any = rows && rows[0];
    if (!order) return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
    await sb.from("kara_orders").update({ status, note: b.note || order.note, updated_at: new Date().toISOString() }).eq("id", order.id);
    const html = "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'><h2 style='color:#d97706'>Order " + order.code + " - " + status.toUpperCase() + "</h2><p>Hi " + (order.buyer_name || "friend") + ", Tunde here. " + MSG[status] + "</p>" + (b.note ? "<p><b>Seller note:</b> " + b.note + "</p>" : "") + (status === "delivered" ? "<p><a href='https://founderpilot-theta.vercel.app/karakata' style='background:#d97706;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:bold'>Shop again</a></p>" : "") + "<p>- Tunde, KaraKata Order Agent</p></div>";
    const inserts: any[] = [{ email: order.buyer_email, kind: "order_" + status, subject: "KaraKata order " + order.code + " is " + status, body: html, status: "queued", send_at: new Date().toISOString() }];
    if (status === "delivered") inserts.push({ email: order.buyer_email, kind: "review_request", subject: "How was your KaraKata order " + order.code + "?", body: "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'><h2 style='color:#d97706'>Two minutes: rate your seller</h2><p>Hi " + (order.buyer_name || "friend") + ", Tunde here. Your review helps the next buyer and helps good sellers rise. Reply with 1-5 stars and one sentence - I will publish it to the storefront.</p><p>- Tunde</p></div>", status: "queued", send_at: new Date(Date.now() + 2 * 86400000).toISOString() });
    await sb.from("kara_emails").insert(inserts);
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
