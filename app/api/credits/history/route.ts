import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = (searchParams.get("email") || "").toLowerCase();
  const limit = Number(searchParams.get("limit") || 50);

  if (!email) return NextResponse.json({ error: "email required" }, { status: 400 });

  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);

  const { data: history, error } = await sb.rpc("get_credit_history", {
    p_email: email,
    p_limit: limit
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ history: history || [] });
}
