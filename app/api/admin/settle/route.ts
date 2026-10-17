import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const u = new URL(req.url);
  const key = u.searchParams.get("key") || "";
  if (key !== (process.env.ADMIN_PASSCODE || "founder2026"))
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
  const { data, error } = await supabase.rpc("settle_due");
  if (error) return NextResponse.json({ ok: false, error: error.message });
  return NextResponse.json({ ok: true, result: data });
}