import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "no id" }, { status: 400 });
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data, error } = await sb.from("pilot_sign_docs").select("*").eq("id", id).single();
  if (error || !data) return NextResponse.json({ error: "not found" }, { status: 404 });
  let pdf_url = data.pdf_base64 || "";
  if (data.pdf_path) pdf_url = (process.env.SUPABASE_URL || "") + "/storage/v1/object/public/contracts/" + data.pdf_path;
  return NextResponse.json(Object.assign({}, data, { pdf_url: pdf_url }));
}