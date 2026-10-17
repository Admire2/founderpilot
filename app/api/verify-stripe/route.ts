import { NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_live_unconfigured");
const sb = () => createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!);

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const sid = sp.get("session") || "";
  if (!sid) return NextResponse.json({ agent: "Mint", error: "no session" }, { status: 400 });
  try {
    const s = await stripe.checkout.sessions.retrieve(sid);
    if (s.payment_status !== "paid") return NextResponse.json({ agent: "Mint", error: "not paid" }, { status: 402 });
    const email = (s.customer_details && s.customer_details.email) || "";
    const db = sb();
    for (let i = 0; i < 8; i++) {
      const r: any = await (db.from("stripe_events") as any).select("*").eq("email", email).order("created_at", { ascending: false }).limit(1);
      if (r.data && Array.isArray(r.data) && r.data.length && r.data[0].status === "credited") {
        return NextResponse.json({ agent: "Mint", ok: true, email, credits: r.data[0].credits, pack: r.data[0].pack, topped: "webhook" });
      }
      await new Promise((res) => setTimeout(res, 1000));
    }
    return NextResponse.json({ agent: "Mint", ok: true, email, credits: 0, pack: "pending", topped: "awaiting webhook" });
  } catch (e: any) {
    return NextResponse.json({ agent: "Mint", error: "invalid session" }, { status: 400 });
  }
}