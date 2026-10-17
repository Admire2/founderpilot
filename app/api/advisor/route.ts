import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const c = async (t: string) => { try { const r = await sb.from(t).select("*", { count: "exact", head: true }); return r.count || 0; } catch { return 0; } };
  const leads = await c("leads");
  const wallets = await c("credits");
  const docs = await c("pilot_sign_docs");
  let signed = 0; try { const r = await sb.from("pilot_sign_docs").select("*", { count: "exact", head: true }).eq("status", "signed"); signed = r.count || 0; } catch {}
  const waitlist = await c("waitlist");
  let storage = 0; try { const r = await sb.storage.from("contracts").list(); storage = (r.data || []).length; } catch {}

  const recs: { tag: string; title: string; detail: string }[] = [];
  recs.push({ tag: "COST", title: "Zero-cost compute maintained", detail: "All PDF processing runs in the client browser - server bills stay $0 no matter how many clients you add." });
  recs.push({ tag: "COST", title: "Storage auto-cleanup active", detail: "Drafts auto-purge after 30 days. Current vault files: " + storage + "." });
  if (signed > 0) recs.push({ tag: "REVENUE", title: "Switch on Stripe packs now", detail: signed + " executed contract(s) prove demand. At 60% of DocuSign ($1.80/envelope) that is $" + (signed * 1.8).toFixed(2) + " already earned if billing were live." });
  if (leads > wallets) recs.push({ tag: "GROWTH", title: "Funnel leak detected", detail: leads + " leads captured vs " + wallets + " wallets activated. Have Pia email every lead a 5-credit bonus to activate them." });
  if (waitlist > 0) recs.push({ tag: "QUALITY", title: "Waitlist intelligence", detail: waitlist + " waitlist signup(s) on record - build the most-requested tool next and email them the day it ships." });
  if (docs > 0 && signed === 0) recs.push({ tag: "QUALITY", title: "Signing friction check", detail: "Documents sent but none executed yet - test the signer flow on a phone and simplify the first screen." });
  recs.push({ tag: "QUALITY", title: "Free feedback loop", detail: "Add a 1-click 'Report a problem' under each tool that writes to the leads table - fixes become data-driven and cost $0." });

  let note = "";
  try {
    const prompt = "You are Cleo, COO advisor for FounderPilot AI business suite. Metrics: leads=" + leads + ", wallets=" + wallets + ", docsSent=" + docs + ", executed=" + signed + ", waitlist=" + waitlist + ", vaultFiles=" + storage + ". Give 5 short bullet improvements focused on cheap, affordable, high-quality service. Plain bullets only.";
    const r = await fetch("https://text.pollinations.ai/" + encodeURIComponent(prompt));
    if (r.ok) note = await r.text();
  } catch (e) {}

  try { await sb.from("advisor_log").insert({ metrics: JSON.stringify({ leads, wallets, docs, signed, waitlist, storage }), recs: JSON.stringify(recs), note: note }); } catch (e) {}

  return NextResponse.json({ metrics: { leads, wallets, docs, signed, waitlist, storage }, recs: recs, note: note });
}