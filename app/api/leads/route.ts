import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, device_id, tool, meta } = await req.json();
  if (!email || !email.includes("@")) return NextResponse.json({ error: "bad email" }, { status: 400 });
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { error } = await sb.from("leads").insert({ email: email, device_id: device_id || "", tool: tool || "", meta: meta || "" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}