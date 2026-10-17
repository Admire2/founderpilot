import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const key = process.env.GLM_API_KEY;
  const url = process.env.GLM_URL || "https://api.z.ai/api/paas/v4/chat/completions";
  const model = process.env.GLM_MODEL || "glm-5.3-flash";

  if (!key) {
    return NextResponse.json({ ok: false, error: "GLM_API_KEY not configured" }, { status: 500 });
  }

  let available = false;
  let status = 0;
  let errorType = "";

  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: "Bearer " + key, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: model,
        messages: [{ role: "user", content: "ok" }]
      })
    });

    status = r.status;

    if (r.ok) {
      available = true;
      console.log("✅ GLM available");
    } else if (r.status === 429) {
      errorType = "rate_limited";
      console.log("⚠️ GLM rate limited");
    } else if (r.status === 402) {
      errorType = "quota_exceeded";
      console.log("⚠️ GLM quota exceeded");
    } else {
      errorType = "status_" + r.status;
      console.log("❌ GLM error:", r.status);
    }
  } catch (e: any) {
    errorType = "exception";
    console.error("GLM check failed:", e.message);
  }

  // Check if status changed from unavailable to available
  const { data: lastCheck } = await sb
    .from("kara_quota_checks")
    .select("any_available")
    .eq("provider", "glm")
    .order("checked_at", { ascending: false })
    .limit(1)
    .single();

  const wasUnavailable = lastCheck && !lastCheck.any_available;

  if (available && wasUnavailable) {
    // Send alert
    await sb.from("kara_emails").insert({
      to: "greatmind20@gmail.com",
      subject: "🧠 GLM 5.3 Flash Available!",
      body: `
        <h2>GLM is back online!</h2>
        <p>Z.ai rate limits have reset. The cascade will now automatically use GLM 5.3 Flash for:</p>
        <ul>
          <li>VIN reading (multimodal car papers)</li>
          <li>Dispute evidence OCR</li>
          <li>Complex reasoning tasks</li>
        </ul>
        <p>Check it: <a href="https://founderpilot-theta.vercel.app/api/karakata/autos/vin-reader">VIN Reader</a></p>
      `,
      status: "queued"
    });
    console.log("📧 Alert sent: GLM available");
  }

  // Store this check
  await sb.from("kara_quota_checks").insert({
    provider: "glm",
    any_available: available,
    results: { status, errorType, checkedAt: new Date().toISOString() },
    checked_at: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    available: available,
    status: status,
    errorType: errorType,
    checkedAt: new Date().toISOString()
  });
}