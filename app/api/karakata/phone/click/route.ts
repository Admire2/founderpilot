import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const email = String(url.searchParams.get("email") || "");
  const dest = String(url.searchParams.get("to") || "/karakata");
  if (!email) return NextResponse.redirect(dest, 302);

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  await sb.from("kara_webinar_registrants").update({ clicked: true }).eq("email", email);

  return NextResponse.redirect(dest, 302);
}