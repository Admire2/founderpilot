import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { email, tool } = await req.json();
  if (!email || !email.includes("@")) return NextResponse.json({ error: "bad email" }, { status: 400 });
  const url = process.env.SUPABASE_URL || "";
  const key = process.env.SUPABASE_ANON_KEY || "";
  if (!url || !key) return NextResponse.json({ error: "db not configured" }, { status: 500 });
  const sb = createClient(url, key);
  const { error } = await sb.from("waitlist").insert({ email: email, tool: tool || "unknown" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}