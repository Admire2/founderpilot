import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const models = [
    "stepaudio-3-tts",
    "stepaudio-2.5-tts",
    "stepaudio-3-gen-preview"
  ];

  const results: any[] = [];

  for (const model of models) {
    try {
      const r = await fetch("https://api.stepfun.ai/v1/audio/speech", {
        method: "POST",
        headers: {
          Authorization: "Bearer " + (process.env.STEPFUN_API_KEY || ""),
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          model: model,
          input: "test",
          voice: "default"
        })
      });

      const status = r.status;
      let available = false;
      let errorType = "";

      if (status === 200) {
        available = true;
      } else if (status === 402) {
        errorType = "quota_exceeded";
      } else if (status === 400) {
        errorType = "bad_request";
      } else {
        errorType = "status_" + status;
      }

      results.push({
        model: model,
        available: available,
        status: status,
        errorType: errorType,
        checkedAt: new Date().toISOString()
      });

      console.log(`StepFun ${model}: ${available ? "AVAILABLE" : errorType}`);
    } catch (e: any) {
      results.push({
        model: model,
        available: false,
        status: 0,
        errorType: "exception",
        error: e.message,
        checkedAt: new Date().toISOString()
      });
    }
  }

  // Check if any model is available
  const anyAvailable = results.some(r => r.available);

  // Send alert if quota just became available (wasn't available in last check)
  if (anyAvailable) {
    const { data: lastCheck } = await sb
      .from("kara_quota_checks")
      .select("any_available")
      .order("checked_at", { ascending: false })
      .limit(1)
      .single();

    const wasUnavailable = lastCheck && !lastCheck.any_available;

    if (wasUnavailable) {
      // Send alert email
      const { data: emails } = await sb.from("kara_emails").select("*").limit(1);
      
      await sb.from("kara_emails").insert({
        to: "greatmind20@gmail.com",
        subject: "🎙️ StepFun TTS Quota Available!",
        body: `
          <h2>StepFun audio quota has refreshed!</h2>
          <p>The following models are now available:</p>
          <ul>
            ${results.filter(r => r.available).map(r => `<li><strong>${r.model}</strong></li>`).join("")}
          </ul>
          <p>KaraKata will now use StepFun neural voices instead of Google TTS.</p>
        `,
        status: "queued"
      });

      console.log("📧 Alert sent: StepFun quota available");
    }
  }

  // Store this check
  await sb.from("kara_quota_checks").insert({
    provider: "stepfun",
    any_available: anyAvailable,
    results: results,
    checked_at: new Date().toISOString()
  });

  return NextResponse.json({
    ok: true,
    anyAvailable: anyAvailable,
    results: results
  });
}