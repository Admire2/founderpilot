import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
const COST = 10;
const SYS = "You are Ounje, an AI nutrition companion inside FounderPilot's Healthcare Suite (ounje = 'food' in Yoruba). Practical, culturally flexible, budget-aware food guidance tied to health conditions. NEVER prescribe diets that conflict with conditions or meds without caution flags (renal disease: potassium/phosphorus; warfarin: vitamin K consistency; statins: grapefruit; diabetes: carb timing; hypertension: sodium; GERD: triggers). Output in order: 1) CONDITION PRINCIPLES - 3-5 bullets on why food moves this condition. 2) FOOD TABLE - three groups: Eat more / Moderate / Limit or avoid, 6-8 items each with a one-line reason. 3) DAY PLAN - breakfast, lunch, dinner, 2 snacks with portions and timing. 4) THREE RECIPES - name, ingredients, 4-6 steps, simple equipment. 5) GROCERY LIST - grouped by aisle. 6) CAUTIONS & MED INTERACTIONS - flag conflicts with listed meds/conditions; confirm with clinician or pharmacist. Close with: 'Ounje is educational nutrition guidance, not medical treatment.'";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const email = String(b.email || "").toLowerCase();
    const cost = COST;
    if (!email) return NextResponse.json({ ok: false, error: "Log in to use Ounje." }, { status: 401 });
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
    const user = "CONDITIONS/GOALS: " + (b.conditions || "") + "\nALLERGIES/DISLIKES: " + (b.allergies || "none") + "\nPREFERENCES/CUISINE: " + (b.prefs || "") + "\nBUDGET: " + (b.budget || "") + "\nPLAN LENGTH: " + (b.plan || "1-day") + "\nCURRENT MEDS: " + (b.meds || "none listed") + "\nCONTEXT FROM iLERA READ (if any): " + (b.context || "none");
    let answer = "";
    const qUrl = process.env.QWEN_API_URL || ""; const qKey = process.env.QWEN_API_KEY || "";
    if (qUrl && qKey) {
      const r = await fetch(qUrl, { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + qKey }, body: JSON.stringify({ model: process.env.QWEN_MODEL || "qwen-plus", messages: [{ role: "system", content: SYS }, { role: "user", content: user }] }) });
      const j = await r.json().catch(() => null);
      answer = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
    }
    if (!answer && process.env.OPENROUTER_API_KEY) {
      const r = await fetch("https://openrouter.ai/api/v1/chat/completions", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + process.env.OPENROUTER_API_KEY }, body: JSON.stringify({ model: "openrouter/auto", messages: [{ role: "system", content: SYS }, { role: "user", content: user }] }) });
      const j = await r.json().catch(() => null);
      answer = (j && j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || "";
    }
    if (!answer) return NextResponse.json({ ok: false, error: "AI provider unreachable." }, { status: 502 });
    return NextResponse.json({ ok: true, answer: answer, cost: COST });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
