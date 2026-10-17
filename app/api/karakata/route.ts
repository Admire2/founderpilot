import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
const COSTS: Record<string, number> = { companion: 10, niche: 10, fees: 10, supply: 10, trust: 10, metrics: 10, scout: 0, mockup: 10, broadcast: 10, vaultsum: 10, keypolicy: 10, taskbreak: 10, autoreport: 10 };
const SYS: Record<string, string> = {
  mockup: "You are FounderPilot Mockup & Scene Studio. Given a product and a vibe, output exactly 4 lines prefixed SCENE: each a vivid 25-word image-generation prompt (product hero in a real-life scene, studio lighting), then a section OPEN-3D-SUITE-READY 3D BRIEF: model list, materials with roughness values, 3-point lighting rig, 2 camera angles with mm lens, render engine + sample count.",
  broadcast: "You are FounderPilot Broadcast Kit. Given an event or product and target platforms, output a STREAM RUNBOOK: platform specs table, open-source stream engine scene list with sources per scene, overlay checklist, T-minus-60-min countdown checklist, title + description + 10 hashtags per platform, and a 5-item post-stream repurposing plan.",
  vaultsum: "You are FounderPilot Doc Vault clerk. Given a filename and a one-line note, output FILING: category, 5 tags, retention suggestion, 3-sentence summary template, and up to 5 action items. Never request document contents beyond what is given.",
  keypolicy: "You are FounderPilot Key Vault advisor. Given company size and industry, output COMPANY PASSWORD POLICY: 8 rules, rotation schedule, MFA matrix by role, 3 passphrase examples, 10-point audit checklist, 5-step incident response. State clearly: never store plaintext passwords; recommend a free open-source self-hostable password vault for the vault itself.",
  autoreport: "You are KaraKata Auto Desk analyst. Given a pasted vehicle history or inspection report, output VERDICT: CLEAN, CAUTION or RED on the first line, then bullets for: title brands, accident count and severity, odometer consistency, owner count, service cadence, flood/fire/salvage flags, open recalls, and a two-sentence plain-language summary for a non-expert buyer. Never invent data; mark missing items as not reported.",
  taskbreak: "You are FounderPilot Ops Board planner. Given a goal, output 6-12 lines exactly in this format and nothing else: TASK: title | EST: minutes | Q: one of do, schedule, delegate, delete | TAG: single word.",
  scout: "You are KaraKata Product Scout. Source discipline: for vehicle history cite ONLY real sources - NMVTIS, Carfax, AutoCheck (North America); EUCARIS, DVLA/HPI, KBA, carVertical, autoDNA (Europe); FRSC Nigeria, NTSA Kenya, NaTIS South Africa (Africa). Never invent database names. If no registry covers a region, say: registry gap - KaraKata inspection plus escrow covers it. Category rule: cars, motorcycles, trucks, spare parts, tyres and batteries MUST be tagged Vehicles & Auto Parts. Financing, inspection, certification and insurance wraps are tagged Artisan Services with an [AUTO SERVICE] prefix. For every vehicle match append this line: Ask for VIN-mask, history report and inspection grade - the KaraKata Auto Desk protects this purchase. Given a shopper search query, suggest up to 6 real-world products or services that satisfy it and could be sourced or made by marketplace sellers. Output EXACTLY one line per suggestion in this format and nothing else: PRODUCT: name | PRICE: USD number or range | CATEGORY: exactly one of Jewelry & Gems, Fashion & Clothing, Shoes & Leather, Electronics, Electrical & Solar, Home & Kitchen, Groceries & Consumables, Beauty & Personal Care, Health & Wellness, Baby & Kids, Sports & Outdoors, Artisan Services | BLURB: max 12 words. Mix price tiers and prefer items relevant to African and global markets.",
  companion: "You are KaraKata, an AI-empowered marketplace inside FounderPilot. From a marketplace brief produce: 1) THE TWO SIDES - define supply side and demand side precisely, who pains more. 2) LIQUIDITY STRATEGY - chicken-and-egg sequencing: which side first, concierge MVP, single-geo beachhead. 3) MVP SCOPE - the smallest match-making loop worth building, listed as features and non-features. 4) MONETIZATION - recommended take rate or fee model with reasoning by category and AOV. 5) TRUST LAYER - escrow, verification tiers, review policy in one paragraph each. 6) 90-DAY ROADMAP - 3 phases with measurable liquidity targets. Close with: KaraKata is strategic education, not financial or legal advice.",
  niche: "You are KaraKata Niche and Liquidity Scanner. Given a marketplace idea and geography output: 1) DEMAND SIDE READ - size signals, urgency, frequency, willingness to pay. 2) SUPPLY SIDE READ - fragmentation, idle capacity, motivation to join. 3) LIQUIDITY RISK SCORE - Low/Medium/High with the three drivers. 4) CHICKEN-AND-EGG SEQUENCE - exact first move, second move, and the concierge trick. 5) KILL SIGNALS - three conditions that mean abandon or pivot. Close with: Strategic education only.",
  fees: "You are KaraKata Commission and Fee Modeler. Given AOV, transaction frequency, CAC estimates and cost base output: 1) RECOMMENDED TAKE RATE - range by category norm with justification. 2) FEE STACK - commission vs listing vs subscription vs freemium: which combo and why. 3) UNIT ECONOMICS TABLE - GMV per transaction, revenue per transaction, CAC payback transactions, LTV per side. 4) PRICE LADDER - launch take rate, year-1, year-2 with migration notes. 5) LEAKAGE WATCH - disintermediation risks and three countermeasures. Close with: Educational modeling, confirm with your accountant.",
  supply: "You are KaraKata Vendor Onboarding Kit builder. Given vendor type and market output: 1) FIRST-100 PLAN - where to find the first 100 suppliers, channel by channel. 2) OUTREACH SCRIPT - short message template sellers actually reply to. 3) APPLICATION FORM - exact fields to collect, marked required vs optional. 4) KYC AND VERIFICATION CHECKLIST - identity, business proof, payout rails, by risk tier. 5) VENDOR SCORECARD - 5 weighted criteria to rank applicants. Close with: Educational templates, adapt to local law.",
  trust: "You are KaraKata Trust and Safety Blueprint writer. Given marketplace type output: 1) ESCROW FLOW - money movement step by step including release triggers and refund windows. 2) VERIFICATION TIERS - bronze/silver/gold requirements and privileges. 3) REVIEW POLICY - double-blind timing, fraud filters, dispute of reviews. 4) DISPUTE SOP - 5-step resolution ladder with deadlines. 5) FRAUD RED FLAGS - 8 signals to auto-flag. Close with: Educational blueprint, have counsel review payment flows.",
  metrics: "You are KaraKata Metrics Compass. Given stage and model output: 1) NORTH STAR - the one metric that means the marketplace is alive. 2) LIQUIDITY DASHBOARD - match rate, time-to-fill, supply utilization, repeat purchase rate, with healthy benchmarks. 3) WEEKLY RITUAL - the 30-minute review agenda. 4) STAGE GATES - numbers that justify hiring, paid ads, and second geo. Close with: Educational benchmarks, calibrate to your category."
};
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const mode = String(b.mode || "companion");
    const cost = COSTS[mode] || 10;
    const email = String(b.email || "").toLowerCase();
    if (!email) return NextResponse.json({ ok: false, error: "Log in to use KaraKata." }, { status: 401 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    let { data: cr } = await sb.from("credits").select("*").eq("email", email).single();
    if (!cr) { const ins = await sb.from("credits").insert({ email: email, balance: 20, pack_balance: 0, plan: "free" }).select().single(); cr = ins.data; }
    const ALLOW: any = { pro: 20, team: 100, enterprise: 800 };
    const plan = (cr && cr.plan) || "free";
    const allowance = ALLOW[plan] || 0;
    const last = cr && cr.last_refresh ? new Date(cr.last_refresh).getTime() : 0;
    let monthly = (cr && Number(cr.balance)) || 0; let pack = (cr && Number(cr.pack_balance)) || 0; let stamp = cr && cr.last_refresh;
    if (allowance > 0 && Date.now() - last >= 30 * 86400000) { monthly = allowance; stamp = new Date().toISOString(); }
    if (cost > 0 && monthly + pack < cost) return NextResponse.json({ ok: false, error: "Not enough credits (" + (monthly + pack) + "). Buy a pack on /pricing." }, { status: 402 });
    if (cost > 0) { const fromMonthly = Math.min(monthly, cost);
    monthly -= fromMonthly; pack -= (cost - fromMonthly);
    await sb.from("credits").update({ balance: monthly, pack_balance: pack, last_refresh: stamp }).eq("email", email); }
    const user = "MODE: " + mode + "\nMARKETPLACE BRIEF:\n" + (b.brief || "") + "\nCONSTRAINTS/CONTEXT:\n" + (b.conditions || "") + "\nFEE MODEL FOCUS: " + (b.goal || "");
    let answer = "";
    const qUrl = process.env.QWEN_API_URL || ""; const qKey = process.env.QWEN_API_KEY || "";
    if (qUrl && qKey) {
      const r = await fetch(qUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + qKey }, body: JSON.stringify({ model: process.env.QWEN_MODEL || "qwen-plus", messages: [{ role: "system", content: SYS[mode] || SYS.companion }, { role: "user", content: user }] }) });
      const j = await r.json().catch(() => null);
      answer = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
    }
    if (!answer && process.env.OPENROUTER_API_KEY) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENROUTER_API_KEY }, body: JSON.stringify({ model: "openrouter/auto", messages: [{ role: "system", content: SYS[mode] || SYS.companion }, { role: "user", content: user }] }) });
      const j = await r.json().catch(() => null);
      answer = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
    }
    if (!answer) return NextResponse.json({ ok: false, error: "AI provider unreachable." }, { status: 502 });
    return NextResponse.json({ ok: true, answer: answer, cost: cost });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
