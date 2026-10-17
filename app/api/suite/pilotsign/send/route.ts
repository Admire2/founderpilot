import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { agentSend, signRequestHtml } from "@/lib/mailAgent";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json();
  const sender = body.sender || "";
  const parties = body.parties || [];
  const signer = body.signer || (parties.length ? parties[parties.length - 1].email : "") || sender;
  const sellerName = body.sellerName || (parties[0] ? parties[0].name : "") || "";
  const buyerName = body.buyerName || (parties[1] ? parties[1].name : "") || "";
  const nextParty = typeof body.nextParty === "number" ? body.nextParty : 0;
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const temp = "temp-" + Date.now() + "-" + Math.floor(Math.random() * 1000000000);
  const { data, error } = await sb.from("pilot_sign_docs").insert({
    sender_email: sender, signer_email: signer, doc_name: body.name, pdf_path: body.pdfPath, magic_link: temp,
    seller_name: sellerName, buyer_name: buyerName, parties: JSON.stringify(parties), next_party: nextParty
  }).select("id").single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const origin = "https://founderpilot-theta.vercel.app";
  const link = "/sign/" + data.id;
  await sb.from("pilot_sign_docs").update({ magic_link: link }).eq("id", data.id);
  let emailSent = false;
  const to = parties[nextParty] ? parties[nextParty].email : signer;
  if (to) {
    try {
      const r = await agentSend(to, "Signature Required: " + body.name, signRequestHtml(body.name, sellerName || sender, (parties[nextParty] ? parties[nextParty].name : buyerName) || signer, origin + link + (parties.length ? "?party=" + nextParty : "")));
      emailSent = r.ok;
    } catch (e) {}
  }
  return NextResponse.json({ ok: true, id: data.id, link: origin + link, emailSent: emailSent });
}