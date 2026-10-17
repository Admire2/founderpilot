import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { id, path } = await req.json();
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  await sb.from("pilot_sign_docs").delete().eq("id", id);
  if (path) await sb.storage.from("contracts").remove([path]);
  return NextResponse.json({ ok: true });
}