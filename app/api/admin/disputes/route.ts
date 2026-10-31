import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    // ✅ 1. VERIFY REAL ADMIN AUTH (No more hardcoded passcodes)
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error: "Unauthorized: No token provided" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    // Use Service Role to bypass RLS for admin queries, but we validate the JWT first
    const sbAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: { user }, error: authError } = await sbAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Unauthorized: Invalid session" }, { status: 401 });
    }

    const { data: profile } = await sbAdmin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden: Admin access required" }, { status: 403 });
    }

    // ✅ 2. FETCH ALL DISPUTES
    const { data: disputes, error } = await sbAdmin
      .from("kara_orders")
      .select("*")
      .in("status", ["dispute_open", "dispute_under_review"])
      .order("created_at", { ascending: false });

    if (error) throw error;

    // ✅ 3. FETCH SELLER DETAILS FOR CONTEXT
    const sellerIds = [...new Set(disputes?.map(d => d.seller_id).filter(Boolean))];
    let sellerMap: Record<string, any> = {};
    if (sellerIds.length > 0) {
      const { data: sellers } = await sbAdmin.from("sellers").select("id, shop_name, email").in("id", sellerIds);
      sellers?.forEach(s => { sellerMap[String(s.id)] = s; });
    }

    // ✅ 4. CALCULATE ESCROW METRICS
    const { data: allEscrow } = await sbAdmin
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
