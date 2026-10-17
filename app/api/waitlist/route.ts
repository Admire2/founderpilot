import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const { tool, email } = await req.json();
  if (!tool || !String(email || "").includes("@")) return NextResponse.json({ error: "missing" }, { status: 400 });
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  await sb.from("waitlist").insert({ tool: tool, email: String(email).toLowerCase() });
  return NextResponse.json({ ok: true });
}