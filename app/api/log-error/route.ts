import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b = await req.json();
    const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    
    await supabase.from("system_errors").insert({
      user_email: b.email || "anonymous",
      page_url: b.url || "unknown",
      error_type: b.type || "unknown",
      error_message: b.message || "No message",
      stack_trace: b.stack || "",
      context: b.context || {}
    });
    
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false }); }
}