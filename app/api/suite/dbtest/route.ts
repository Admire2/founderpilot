import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function GET() {
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return NextResponse.json({ ok: false, error: "env vars missing" });
  
  try {
    const sb = createClient(url, key);
    const { error } = await sb.from("waitlist").select("id").limit(1);
    if (error) return NextResponse.json({ ok: false, error: error.message });
    return NextResponse.json({ ok: true, message: "Database connected! Keys accepted!" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message || e) });
  }
}