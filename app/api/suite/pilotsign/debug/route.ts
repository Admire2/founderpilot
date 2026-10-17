import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email") || "";
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data } = await sb.from("pilot_sign_docs").select("*").eq("sender_email", email).order("created_at", { ascending: false }).limit(2);
  return NextResponse.json({ rows: data });
}