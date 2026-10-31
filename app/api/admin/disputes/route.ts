import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    const token = authHeader.split(" ")[1];
    const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error: authError } = await sb.auth.getUser(token);
    if (authError || !user) return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    const { data: profile } = await sb.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    const { data: disputes } = await sb.from("kara_orders").select("*").in("status", ["dispute_open", "dispute_under_review"]).order("created_at", { ascending: false });
    const sellerIds = [...new Set(disputes?.map(d => d.seller_id).filter(Boolean))];
    let sellerMap = {};
    if (sellerIds.length > 0) { const { data: sellers } = await sb.from("sellers").select("id, shop_name, email").in("id", sellerIds); sellers?.forEach(s => { sellerMap[String(s.id)] = s; }); }
    const { data: allEscrow } = await sb.from("kara_orders").select("total_amount, escrow_amount, status").in("status", ["escrow_active", "shipped", "dispute_open", "dispute_under_review"]);
    return NextResponse.json({ ok: true, disputes: (disputes || []).map(d => ({ ...d, seller: sellerMap[String(d.seller_id)] || { shop_name: "Unknown" } })), metrics: { totalDisputes: disputes?.length || 0, openDisputes: disputes?.filter(d => d.status === "dispute_open").length || 0, underReview: disputes?.filter(d => d.status === "dispute_under_review").length || 0, totalEscrowHeld: allEscrow?.reduce((sum, o) => sum + (Number(o.escrow_amount) || 0), 0) || 0, disputeEscrowHeld: disputes?.reduce((sum, d) => sum + (Number(d.escrow_amount) || 0), 0) || 0 } });
  } catch (err) { return NextResponse.json({ ok: false, error: err.message }, { status: 500 }); }
}
