import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { sendMail } from "@/lib/mail";
export const dynamic = "force-dynamic";

async function flush() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!url || !key) {
    return NextResponse.json({ ok: false, error: "Missing Supabase env vars", has_url: !!url, has_key: !!key });
  }

  const sb = createClient(url, key);
  const { data: rows, error } = await sb.from("kara_emails").select("*").eq("status", "queued").order("id", { ascending: true }).limit(10);
  
  if (error) {
    return NextResponse.json({ ok: false, db_error: error.message, rows });
  }

  let sent = 0; const errs: string[] = [];
  
  for (const r of rows || []) {
    try {
      await sendMail({ to: r.email, subject: r.subject, html: r.body });
      await sb.from("kara_emails").update({ status: "sent", sent_at: new Date().toISOString() }).eq("id", r.id);
      sent++;
    } catch (e: any) {
      errs.push(String((e && e.message) || e));
      await sb.from("kara_emails").update({ status: "failed", error_msg: String((e && e.message) || e) }).eq("id", r.id);
    }
  }
  return NextResponse.json({ ok: true, sent, errs, rows_found: (rows || []).length, env_check: { url_present: !!url, key_present: !!key } });
}

export async function POST() { return flush(); }
export async function GET() { return flush(); }