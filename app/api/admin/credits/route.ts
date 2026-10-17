import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").toLowerCase();
    const amount = Number(body.amount) || 0;
    const reason = body.reason || "Admin grant";
    
    if (!email || amount <= 0) {
      return NextResponse.json({ error: "email and positive amount required" }, { status: 400 });
    }
    
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    
    // Get or create credits record
    let { data } = await sb.from("credits").select("*").eq("email", email).single();
    if (!data) {
      const ins = await sb.from("credits").insert({ email, balance: 0, pack_balance: amount, plan: "free" }).select().single();
      data = ins.data;
    } else {
      // Add to pack_balance (purchased/granted credits are permanent)
      const newPack = (data.pack_balance || 0) + amount;
      await sb.from("credits").update({ pack_balance: newPack }).eq("email", email);
    }
    
    // LOG THE GRANT TO LEDGER
    await sb.from("credit_transactions").insert({
      email,
      type: "admin_grant",
      amount: amount, // Positive = credits IN
      source: "admin_panel",
      description: reason,
      metadata: { granted_by: body.admin_email || "unknown" }
    });
    
    return NextResponse.json({ 
      success: true, 
      email, 
      granted: amount, 
      newPackBalance: (data.pack_balance || 0) + amount 
    });
    
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
