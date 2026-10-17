import { createClient } from "@supabase/supabase-js";
import nodemailer from "nodemailer";
export type MailMsg = { to: string; subject: string; html: string; from?: string };

async function getDailyCount(provider: string): Promise<number> {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { data } = await sb.from("kara_email_stats").select("count").eq("provider", provider).eq("sent_date", new Date().toISOString().split('T')[0]).single();
  return data?.count || 0;
}

async function incrementCount(provider: string) {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const today = new Date().toISOString().split('T')[0];
  const { data: current } = await sb.from("kara_email_stats").select("count").eq("provider", provider).eq("sent_date", today).single();
  if (current) {
    await sb.from("kara_email_stats").update({ count: current.count + 1 }).eq("provider", provider).eq("sent_date", today);
  } else {
    await sb.from("kara_email_stats").insert({ provider, sent_date: today, count: 1 });
  }
}

async function sendViaResend(m: MailMsg): Promise<string> {
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: "Bearer " + process.env.RESEND_API_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ from: m.from || process.env.MAIL_FROM || "KaraKata <onboarding@resend.dev>", to: [m.to], subject: m.subject, html: m.html }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(String((j && j.message) || r.status));
  return String(j.id || "resend-ok");
}

async function sendViaGmail(m: MailMsg): Promise<string> {
  const t = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
  const info = await t.sendMail({ from: m.from || process.env.SMTP_USER, to: m.to, subject: m.subject, html: m.html });
  return String(info.messageId || "gmail-ok");
}

export async function sendMail(m: MailMsg): Promise<string> {
  const resendCount = await getDailyCount("resend");
  if (resendCount < 100) {
    try {
      const id = await sendViaResend(m);
      await incrementCount("resend");
      return id;
    } catch (e) { console.error("Resend failed, falling back:", e); }
  }
  const gmailCount = await getDailyCount("gmail");
  if (gmailCount < 500) {
    const id = await sendViaGmail(m);
    await incrementCount("gmail");
    return id;
  }
  throw new Error("Both providers hit daily limits.");
}