import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
const COST = 2;
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = String(b.email || "").toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Log in to use Seller Studio." }, { status: 401 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    let { data: cr } = await sb.from("credits").select("*").eq("email", email).single();
    if (!cr) { const ins = await sb.from("credits").insert({ email: email, balance: 20, pack_balance: 0, plan: "free" }).select().single(); cr = ins.data; }
    let monthly = (cr && Number(cr.balance)) || 0; let pack = (cr && Number(cr.pack_balance)) || 0;
    if (monthly + pack < COST) return NextResponse.json({ ok: false, error: "Not enough credits (" + (monthly + pack) + "). Buy a pack on /pricing." }, { status: 402 });
    const fromMonthly = Math.min(monthly, COST); monthly -= fromMonthly; pack -= (COST - fromMonthly);
    await sb.from("credits").update({ balance: monthly, pack_balance: pack }).eq("email", email);
    const sys = "You are KaraKata Listing Studio. From a rough product note and optional photo, produce a marketplace listing. Output EXACTLY these lines, one per line, no extra text: TITLE: short catchy title under 60 chars. PRICE_USD: number. COMPARE_AT: number about 25 percent above price. TAGS: six comma separated search tags. CATEGORY: exactly one of Jewelry & Gems, Shoes & Leather, Clothing & Textiles, Luxury Consumables, Artisan Services. DESCRIPTION: 60 to 90 words sales-ready plain English, benefits first, no emojis. LEAD_DAYS: fulfillment days as number. Price affordably using the cost floor if provided, otherwise category norms. Never invent certifications.";
    const user = "ROUGH NOTES: " + (b.words || "") + "\nCATEGORY HINT: " + (b.category || "") + "\nCOST FLOOR USD: " + (b.cost || "not provided") + "\nPHOTO: " + (b.image ? "provided" : "none");
    let answer = "";
    const qUrl = process.env.QWEN_API_URL || ""; const qKey = process.env.QWEN_API_KEY || "";
    if (qUrl && qKey) {
      const r = await fetch(qUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + qKey }, body: JSON.stringify({ model: process.env.QWEN_MODEL || "qwen-plus", messages: [{ role: "system", content: sys }, { role: "user", content: user }] }) });
      const j = await r.json().catch(() => null);
      answer = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
    }
    if (!answer && process.env.OPENROUTER_API_KEY) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENROUTER_API_KEY }, body: JSON.stringify({ model: "openrouter/auto", messages: [{ role: "system", content: sys }, { role: "user", content: user }] }) });
      const j = await r.json().catch(() => null);
      answer = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
    }
    if (!answer) return NextResponse.json({ ok: false, error: "AI provider unreachable - credits not charged." }, { status: 502 });
    return NextResponse.json({ ok: true, answer: answer, cost: COST });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
