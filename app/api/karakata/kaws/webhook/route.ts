import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const body = await req.json();
    
    if (body.message?.type === "end-of-call-report") {
      const call = body.message.call;
      const callId = call.id || "UNKNOWN-ID";
      const customerNumber = call.customer?.number || "";

      // Look for the summary in multiple places Vapi might hide it
      const summary = 
        call.analysis?.summary || 
        call.artifact?.highlights || 
        call.messages?.[call.messages.length - 1]?.content || 
        "Call completed. No summary generated.";

      console.log(`🔔 CALL ENDED. Saving call_id: ${callId}`);
      console.log(`📝 Summary found: ${summary.substring(0, 50)}...`);

      const { data, error } = await supabase
        .from('kara_crm_records')
        .insert({ 
          call_id: callId,
          summary: summary,
          status: 'intake',
          tenant_id: 'karakata',
          industry_id: 'real_estate'
        })
        .select();

      if (error) {
        console.error("❌ Supabase insert error:", error);
      } else {
        console.log("✅ Successfully saved to kara_crm_records. New ID:", data?.[0]?.id);
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: false, error: "Webhook failed" }, { status: 500 });
  }
}