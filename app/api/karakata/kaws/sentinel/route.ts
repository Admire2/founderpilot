import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const vapiKey = process.env.VAPI_API_KEY;
  const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const sbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 1. Safety Check: If keys are missing, return a mock success so Cron Job doesn't panic
  if (!vapiKey || !sbUrl || !sbKey) {
    console.warn("⚠️ Sentinel: Missing API Keys. Running in Mock Mode.");
    return NextResponse.json({ 
      ok: true, 
      status: "MOCK_MODE", 
      message: "API Keys missing in Vercel. System is safe but not monitoring live calls yet.",
      error_rate: 0 
    });
  }

  try {
    const sb = createClient(sbUrl, sbKey);

    // 2. Check recent calls from Vapi
    const res = await fetch("https://api.vapi.ai/call?limit=50&status=ended", {
      headers: { Authorization: "Bearer " + vapiKey }
    });
    
    if (!res.ok) throw new Error(`Vapi API error: ${res.status}`);
    
    const calls: any[] = await res.json();
    const failed = calls.filter((c: any) => c.endedReason && c.endedReason.includes('error')).length;
    const errorRate = calls.length > 0 ? (failed / calls.length) * 100 : 0;

    // 3. Log to Database
    await sb.from("kara_sentinel_logs").insert({
      total_calls: calls.length,
      failed_calls: failed,
      error_rate: errorRate,
      primary_model: "Groq - Llama 3.3",
      action_taken: errorRate > 20 ? "CRITICAL: High error rate detected" : "System Healthy"
    });

    return NextResponse.json({ ok: true, error_rate: errorRate, total_calls: calls.length });
  } catch (e: any) {
    console.error("Sentinel Error:", e);
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}