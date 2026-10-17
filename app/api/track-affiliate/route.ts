import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    const track = b.track || "suite"; await supabase.from("affiliate_clicks").insert({
      user_email: b.email || "anonymous",
      partner_name: b.partner,
      suite: b.suite, track: track,
      project_context: b.context || "unknown"
    });
    
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false }); }
}