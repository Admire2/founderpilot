import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");
  if (!email) return NextResponse.json({ error: "no email" }, { status: 400 });
  
  const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
  const { data, error } = await sb.from("pilot_sign_docs")
    .select("*")
    .eq("sender_email", email)
    .order("created_at", { ascending: false });
    
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  
  // LAZY CLEANUP: Auto-purge drafts older than 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const draftsToDelete = (data || []).filter(d => d.status === "pending" && new Date(d.created_at) < thirtyDaysAgo);
  
  if (draftsToDelete.length > 0) {
    const idsToDelete = draftsToDelete.map(d => d.id);
    await sb.from("pilot_sign_docs").delete().in("id", idsToDelete);
    // Also try to delete the files from storage if they exist
    for (const d of draftsToDelete) {
      if (d.pdf_path) await sb.storage.from("contracts").remove([d.pdf_path]);
    }
  }

  const base = process.env.SUPABASE_URL || "";
  const docs = (data || [])
    .filter(d => !draftsToDelete.find(x => x.id === d.id)) // Remove purged drafts from the returned list
    .map((d: any) => {
      let pdf_url = d.pdf_base64 || "";
      if (d.pdf_path) pdf_url = base + "/storage/v1/object/public/contracts/" + d.pdf_path;
      return Object.assign({}, d, { pdf_url: pdf_url });
    });
    
  return NextResponse.json({ docs: docs });
}