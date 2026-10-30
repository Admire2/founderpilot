import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // ✅ Admin authentication (same passcode as your existing admin panel)
    const url = new URL(req.url);
    const key = url.searchParams.get("key");
    if (key !== (process.env.ADMIN_PASSCODE || "founder2026")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const sb = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // ✅ Fetch ALL orders in dispute states
    const { data: disputes, error } = await sb
      .from("kara_orders")
      .select("*")
      .in("status", ["dispute_open", "dispute_under_review"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    // ✅ Fetch seller details for each dispute
    const sellerIds = [...new Set(disputes?.map(d => d.seller_id).filter(Boolean))];
    let sellerMap: Record<string, any> = {};
    if (sellerIds.length > 0) {
      const { data: sellers } = await sb.from("sellers").select("id, shop_name, email").in("id", sellerIds);
      sellers?.forEach(s => { sellerMap[String(s.id)] = s; });
    }

    // ✅ Calculate escrow health metrics
    const { data: allEscrow } = await sb
      .from("kara_orders")
      .select("total_amount, escrow_amount, status")
      .in("status", ["escrow_active", "shipped", "dispute_open", "dispute_under_review"]);

    const totalHeld = allEscrow?.reduce((sum, o) => sum + (Number(o.escrow_amount) || 0), 0) || 0;
    const disputeHeld = disputes?.reduce((sum, d) => sum + (Number(d.escrow_amount) || 0), 0) || 0;

    return NextResponse.json({
      ok: true,
      disputes: (disputes || []).map(d => ({
        ...d,
        seller: sellerMap[String(d.seller_id)] || { shop_name: "Unknown", email: "N/A" }
      })),
      metrics: {
        totalDisputes: disputes?.length || 0,
        openDisputes: disputes?.filter(d => d.status === "dispute_open").length || 0,
        underReview: disputes?.filter(d => d.status === "dispute_under_review").length || 0,
        totalEscrowHeld: totalHeld,
        disputeEscrowHeld: disputeHeld
      }
    });
  } catch (err: any) {
    console.error("Admin disputes error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
