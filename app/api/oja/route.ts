import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
const COSTS: Record<string, number> = { listing: 10, price: 10, quote: 10 };
const SYS: Record<string, string> = {
  listing: "You are Oja Listing Writer inside FounderPilot Marketplace Suite. From the seller's rough notes produce: 1) TITLE - under 70 characters, keyword-first. 2) HOOK - one sentence benefit. 3) FIVE BULLETS - feature turned into benefit, plain language. 4) DESCRIPTION - 120 to 160 words with sensory detail, use-cases and a specs line. 5) SEO KEYWORDS - 8 comma-separated. 6) CHANNEL TWEAKS - one line each for Shopify, Amazon, Etsy, WhatsApp or Instagram catalog. 7) PRICE ANCHOR - recommended range using any price the seller gave. Close with: Run Oja Price Strategist to lock the exact number.",
  price: "You are Oja Price Strategist inside FounderPilot Marketplace Suite. Inputs: unit cost, labor per unit, overhead per unit, competitor prices, target margin, buyer type, monthly volume. Output: 1) COST STACK - per-unit breakdown and break-even price. 2) RECOMMENDED BAND - good/better/best price points with the margin percent at each. 3) PSYCHOLOGY - charm pricing vs round pricing guidance for this specific category. 4) DISCOUNT GUARDRAILS - maximum discount before margin damage plus two bundle ideas instead of price cuts. 5) TEST PLAN - a simple 2-week price test design. Close with: Numbers are educational estimates - confirm with your accountant.",
  quote: "You are Oja Quote and Invoice Builder inside FounderPilot Marketplace Suite. The caller already computed the arithmetic totals and gives them to you as facts - use those exact numbers, never recompute. Output: 1) CLEAN QUOTE BLOCK - business and client names, dated line items with qty and rate, subtotal, tax, discount, grand total, deposit due, validity days. 2) TERMS CLAUSES - payment schedule, late fee, revision limits, warranty or return line, ownership of work. 3) COVER NOTE - a 3-sentence professional message to send with the quote. 4) FOLLOW-UP SEQUENCE - a day-3 and a day-7 nudge line. Plain text, ready for PDF."
};
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const mode = String(b.mode || "listing");
    const cost = COSTS[mode] || 10;
    const email = String(b.email || "").toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Log in to use Oja services." }, { status: 401 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    let { data: cr } = await sb.from("credits").select("*").eq("email", email).single();
    if (!cr) { const ins = await sb.from("credits").insert({ email: email, balance: 20, pack_balance: 0, plan: "free" }).select().single(); cr = ins.data; }
    const ALLOW: any = { pro: 20, team: 100, enterprise: 800 };
    const plan = (cr && cr.plan) || "free";
    const allowance = ALLOW[plan] || 0;
    const last = cr && cr.last_refresh ? new Date(cr.last_refresh).getTime() : 0;
    let monthly = (cr && Number(cr.balance)) || 0; let pack = (cr && Number(cr.pack_balance)) || 0; let stamp = cr && cr.last_refresh;
    if (allowance > 0 && Date.now() - last >= 30 * 86400000) { monthly = allowance; stamp = new Date().toISOString(); }
    if (monthly + pack < cost) return NextResponse.json({ ok: false, error: "Not enough credits (" + (monthly + pack) + "). Buy a pack on /pricing." }, { status: 402 });
    const fromMonthly = Math.min(monthly, cost);
    monthly -= fromMonthly; pack -= (cost - fromMonthly);
    await sb.from("credits").update({ balance: monthly, pack_balance: pack, last_refresh: stamp }).eq("email", email);
    const user = "MODE: " + mode + "\nSELLER BRIEF:\n" + (b.brief || "") + "\nCATEGORY: " + (b.category || "") + "\nAUDIENCE: " + (b.audience || "") + "\nCHANNEL: " + (b.channel || "") + "\nNUMBERS: " + (b.numbers || "");
    let answer = "";
    const qUrl = process.env.QWEN_API_URL || ""; const qKey = process.env.QWEN_API_KEY || "";
    if (qUrl && qKey) {
      const r = await fetch(qUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + qKey }, body: JSON.stringify({ model: process.env.QWEN_MODEL || "qwen-plus", messages: [{ role: "system", content: SYS[mode] || SYS.listing }, { role: "user", content: user }] }) });
      const j = await r.json().catch(() => null);
      answer = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
    }
    if (!answer && process.env.OPENROUTER_API_KEY) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENROUTER_API_KEY }, body: JSON.stringify({ model: "openrouter/auto", messages: [{ role: "system", content: SYS[mode] || SYS.listing }, { role: "user", content: user }] }) });
      const j = await r.json().catch(() => null);
      answer = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
    }
    if (!answer) return NextResponse.json({ ok: false, error: "AI provider unreachable." }, { status: 502 });
    return NextResponse.json({ ok: true, answer: answer, cost: cost });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
