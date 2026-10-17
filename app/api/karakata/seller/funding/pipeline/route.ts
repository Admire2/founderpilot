import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET() {
  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  
  // Get all sellers with a score of 60+ (Growth or Prime)
  const { data, error } = await sb
    .from("kara_seller_analytics")
    .select("*")
    .gte("funding_score", 60)
    .order("funding_score", { ascending: false })
    .limit(50);

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 500 });

  return NextResponse.json({ 
    ok: true, 
    pipeline: data || [],
    total_investable_gmv: (data || []).reduce((s: number, a: any) => s + Number(a.gmv_30d || 0), 0),
    total_funding_requested: (data || []).reduce((s: number, a: any) => s + Number(a.funding_needed_usd || 0), 0)
  });
}