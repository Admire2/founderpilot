import nodemailer from "nodemailer";

export async function agentSend(to: string, subject: string, html: string) {
  const user = process.env.SMTP_USER || "";
  const pass = process.env.SMTP_PASS || "";
  if (!user || !pass) return { ok: false, error: "smtp not configured" };
  const transporter = nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
  await transporter.sendMail({ from: '"Pia - FounderPilot Support Agent" <' + user + ">", to, subject, html });
  return { ok: true };
}

export function signRequestHtml(doc: string, sender: string, buyer: string, link: string) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;background:#0f172a;padding:24px"><div style="max-width:560px;margin:auto;background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;color:#e2e8f0"><h2 style="color:#22d3ee;margin:0 0 8px">FounderPilot PilotSign</h2><p style="color:#94a3b8;font-size:13px;margin:0 0 24px">Automated message from Pia, your PilotSign Support Agent</p><p>Hello ' + buyer + ',</p><p><strong>' + sender + '</strong> has sent you <strong>' + doc + '</strong> for electronic signature.</p><a href="' + link + '" style="display:block;text-align:center;background:#22d3ee;color:#0f172a;font-weight:bold;padding:14px;border-radius:12px;text-decoration:none;margin:24px 0">REVIEW &amp; SIGN DOCUMENT</a><p style="font-size:12px;color:#94a3b8">This secure link is unique to you. After signing, all parties receive a locked, timestamped copy with a full audit trail.</p><p style="font-size:12px;color:#64748b">If the button does not open, paste this link in your browser:<br>' + link + '</p></div></div>';
}

export function completedHtml(doc: string, signedUrl: string) {
  return '<div style="font-family:Arial,Helvetica,sans-serif;background:#0f172a;padding:24px"><div style="max-width:560px;margin:auto;background:#1e293b;border:1px solid #334155;border-radius:16px;padding:32px;color:#e2e8f0"><h2 style="color:#34d399;margin:0 0 8px">Document Fully Executed ✅</h2><p style="color:#94a3b8;font-size:13px;margin:0 0 24px">Automated message from Pia, your PilotSign Support Agent</p><p><strong>' + doc + '</strong> has been signed by all parties and locked in the PilotSign vault.</p><a href="' + signedUrl + '" style="display:block;text-align:center;background:#34d399;color:#0f172a;font-weight:bold;padding:14px;border-radius:12px;text-decoration:none;margin:24px 0">DOWNLOAD FULLY SIGNED COPY</a><p style="font-size:12px;color:#94a3b8">Corporate Retention Policy: completed documents are kept indefinitely in your vault. Always save a local copy for your personal archives.</p></div></div>';
}