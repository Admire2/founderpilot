import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const d = await req.json();
  if (!d.name || !d.email || !d.subject || !d.message) {
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });
  }
  try {
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    await sb.from("contact_messages").insert({
      name: d.name.slice(0, 100),
      email: d.email.slice(0, 200),
      category: (d.category || "General question").slice(0, 100),
      subject: d.subject.slice(0, 300),
      message: d.message.slice(0, 5000),
      status: "new"
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Database error" }, { status: 500 });
  }
}