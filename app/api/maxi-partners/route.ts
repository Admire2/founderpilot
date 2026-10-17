import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const d = await req.json();
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  await sb.from("maxi_partners").insert({ category: d.category, company: d.company, email: d.email, location: d.location || "", certifications: d.certifications || "", turnaround: d.turnaround || "", moq: d.moq || "", capabilities: d.capabilities || "", role: d.role || "vendor", status: "pending", created_at: new Date().toISOString() });
  return NextResponse.json({ ok: true });
}