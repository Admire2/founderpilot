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
      const analysis = call.analysis?.summary || "No summary available";
      const customerNumber = call.customer?.number || "";
      const callId = call.id || "";

      console.log("🔔 CALL ENDED. Saving to kara_crm_records for:", customerNumber);

      const { error } = await supabase
        .from('kara_crm_records')
        .insert({ 
          call_id: callId,
          summary: analysis,
          status: 'intake',
          tenant_id: 'karakata',
          industry_id: 'real_estate',
          created_at: new Date().toISOString()
        });

      if (error) {
        console.error("❌ Supabase insert error:", error);
      } else {
        console.log("✅ Successfully saved to kara_crm_records");
      }
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Webhook error:", e);
    return NextResponse.json({ ok: false, error: "Webhook failed" }, { status: 500 });
  }
}
