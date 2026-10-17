import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { agentSend, signRequestHtml, completedHtml } from "@/lib/mailAgent";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id, signedPath, partyIndex, ip, location, device } = await req.json();
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data: row } = await sb.from("pilot_sign_docs").select("*").eq("id", id).single();
  if (!row) return NextResponse.json({ error: "not found" }, { status: 404 });
  const parties = JSON.parse(row.parties || "[]");
  const idx = typeof partyIndex === "number" ? partyIndex : 0;
  if ((row.next_party || 0) !== idx) return NextResponse.json({ error: "not your turn yet" }, { status: 409 });
  const next = idx + 1;
  const finished = next >= (parties.length || 1);
  const { error } = await sb.from("pilot_sign_docs").update({
    pdf_path: signedPath,
    next_party: next,
    signer_ip: ip || "", signer_location: location || "", signer_device: device || "",
    status: finished ? "signed" : row.status,
    signed_at: finished ? new Date().toISOString() : row.signed_at
  }).eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const origin = "https://founderpilot-theta.vercel.app";
  if (!finished && parties[next]) {
    try { await agentSend(parties[next].email, "Your turn to sign: " + row.doc_name, signRequestHtml(row.doc_name, row.sender_email, parties[next].name, origin + "/sign/" + id + "?party=" + next)); } catch (e) {}
    return NextResponse.json({ ok: true, finished: false, nextParty: next });
  }
  const signedUrl = (process.env.SUPABASE_URL || "") + "/storage/v1/object/public/contracts/" + signedPath;
  const html = completedHtml(row.doc_name, signedUrl);
  for (const p of parties) { try { await agentSend(p.email, "Fully Executed: " + row.doc_name, html); } catch (e) {} }
  return NextResponse.json({ ok: true, finished: true });
}