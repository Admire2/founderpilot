import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  const { business, slug, owner, meta } = await req.json();
  if (!business) return NextResponse.json({ error: "Business name is required" }, { status: 400 });
  const finalSlug = String(slug || "").replace(/[^a-z0-9-]/gi, "").toLowerCase() || Math.random().toString(36).slice(2, 8);
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data: existing } = await sb.from("qr_links").select("slug").eq("slug", finalSlug).single();
  if (existing) return NextResponse.json({ error: "That slug is taken - try another" }, { status: 409 });
  await sb.from("qr_links").insert({ slug: finalSlug, business: business, target: (meta && meta.website) || "", owner: owner || "", meta: meta || {} });
  return NextResponse.json({ slug: finalSlug, url: "https://founderpilot-theta.vercel.app/go/" + finalSlug });
}