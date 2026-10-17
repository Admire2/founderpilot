import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
async function processDue() {
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const key = process.env.RESEND_API_KEY || "";
  const from = process.env.EMAIL_FROM || "Kara <onboarding@resend.dev>";
  const { data: due } = await sb.from("kara_emails").select("*").eq("status", "queued").lte("send_at", new Date().toISOString()).limit(20);
  let sent = 0, logged = 0, failed = 0;
  for (const row of due || []) {
    if (key) {
      try {
        const r = await fetch("https://api.resend.com/emails", { method: "POST", headers: { "Content-Type": "application/json", Authorization: "Bearer " + key }, body: JSON.stringify({ from: from, to: [row.email], subject: row.subject, html: row.body }) });
        if (r.ok) { await sb.from("kara_emails").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", row.id); sent++; continue; }
        await sb.from("kara_emails").update({ status: "failed" }).eq("id", row.id); failed++; continue;
      } catch (e) { await sb.from("kara_emails").update({ status: "failed" }).eq("id", row.id); failed++; continue; }
    }
    await sb.from("kara_emails").update({ status: "logged", sent_at: new Date().toISOString() }).eq("id", row.id); logged++;
  }
  return NextResponse.json({ ok: true, processed: (due || []).length, sent, logged, failed, note: key ? "delivered via Resend" : "RESEND_API_KEY not set - emails logged to kara_emails for retry" });
}
export async function GET() { return processDue(); }
export async function POST() { return processDue(); }
