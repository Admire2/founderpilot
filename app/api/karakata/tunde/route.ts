import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
const COPY: Record<string, { s: string; b: string }> = {
  placed: { s: "Order received - the seller has been notified", b: "<p>Tunde here (KaraKata order agent). Your order is placed and the seller has been notified. They typically accept within 24 hours.</p>" },
  accepted: { s: "Seller accepted your order - preparation begins", b: "<p>Good news: the seller accepted your order and has started preparation. You will get another update the moment it ships.</p>" },
  shipped: { s: "Your order shipped!", b: "<p>Your order is on the way. The seller contact is on your order page for delivery coordination.</p>" },
  delivered: { s: "Delivered! Rate your seller", b: "<p>Delivered - enjoy! Please rate your seller:<br/><br/><a href='/api/karakata/review?order=&stars=1' style='font-size:24px;text-decoration:none;'>⭐</a> <a href='/api/karakata/review?order=&stars=2' style='font-size:24px;text-decoration:none;'>⭐</a> <a href='/api/karakata/review?order=&stars=3' style='font-size:24px;text-decoration:none;'>⭐</a> <a href='/api/karakata/review?order=&stars=4' style='font-size:24px;text-decoration:none;'>⭐</a> <a href='/api/karakata/review?order=&stars=5' style='font-size:24px;text-decoration:none;'>⭐</a><br/><br/><span style='font-size:12px;color:#666;'>Click a star to rate instantly.</span></p>" },
  cancelled: { s: "Order cancelled - refund initiated", b: "<p>This order was cancelled. Any payment held in escrow is released back to you.</p>" }
};
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const status = String(b.status || "");
    if (status === "delivered" && b.order_id) {
      try {
        const base = process.env.VERCEL_URL ? ("https://" + process.env.VERCEL_URL) : "https://founderpilot-theta.vercel.app";
        await fetch(base + "/api/karakata/payout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ order_id: b.order_id }) });
      } catch (e) {}
    }
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    let email = String(b.email || "");
    let title = "";
    if (b.order_id) {
      const { data, error } = await sb.from("kara_orders").select("*").eq("id", b.order_id).single(); if (error) console.error("Tunde fetch error:", error.message);
      if (data) { email = email || data.buyer_email; title = (data.kara_listings && data.kara_listings.title) || "your item"; }
    }
    const c = COPY[status];
    if (!c || !email) return NextResponse.json({ ok: true, skipped: true });
    await sb.from("kara_emails").insert({ email: email, kind: "tunde_" + status, subject: "KaraKata order update: " + c.s + (title ? " - " + title : ""), body: "<div style='font-family:Arial,sans-serif;max-width:600px;margin:auto'><h2 style='color:#0f766e'>📦 " + c.s + "</h2>" + c.b + (title ? "<p>Item: " + title + "</p>" : "") + "<p>- Tunde, KaraKata Order Agent<br/>FounderPilot AI</p></div>", status: "queued", send_at: new Date().toISOString() });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
