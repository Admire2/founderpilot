import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const b = await req.json();
  if (!b.title || !b.description) return NextResponse.json({ ok: false, error: "Title and description required." }, { status: 400 });
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { error } = await sb.from("kara_requests").insert({ email: String(b.email || "").toLowerCase(), title: b.title, category: b.category, description: b.description, budget_usd: Number(b.budget) || null, deadline: b.deadline || null, image_url: b.image_url || null });
  if (error) return NextResponse.json({ ok: false, error: String(error.message) }, { status: 500 });
  return NextResponse.json({ ok: true });
}
