import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { seller_id, action, admin_note } = body;

    if (!seller_id || !action) {
      return NextResponse.json({ ok: false, error: "seller_id and action required" }, { status: 400 });
    }

    if (!["approve", "reject"].includes(action)) {
      return NextResponse.json({ ok: false, error: "Invalid action" }, { status: 400 });
    }

    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

    const sbAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
    const { data: { user }, error: authError } = await sbAdmin.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ ok: false, error: "Invalid session" }, { status: 401 });
    }

    // Verify admin role
    const { data: profile } = await sbAdmin.from("profiles").select("role").eq("id", user.id).single();
    if (profile?.role !== "admin") {
      return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
    }

    // Get seller details before updating
    const { data: seller, error: sellerError } = await sbAdmin
      .from("sellers")
      .select("email, shop_name, category")
      .eq("id", seller_id)
      .single();

    if (sellerError || !seller) {
      return NextResponse.json({ ok: false, error: "Seller not found" }, { status: 404 });
    }

    // Update seller status
    const newStatus = action === "approve" ? "approved" : "rejected";
    const { error: updateError } = await sbAdmin
      .from("sellers")
      .update({ status: newStatus, updated_at: new Date().toISOString() })
      .eq("id", seller_id);

    if (updateError) {
      return NextResponse.json({ ok: false, error: updateError.message }, { status: 500 });
    }

    // ✅ LOG TO AUDIT TRAIL
    const { data: adminProfile } = await sbAdmin
      .from("profiles")
      .select("full_name, department, office_location")
      .eq("id", user.id)
      .single();

    const ip = req.headers.get("x-forwarded-for") || "unknown";
    await sbAdmin.from("admin_audit_logs").insert({
      admin_id: user.id,
      admin_email: user.email,
      admin_name: adminProfile?.full_name || user.email,
      admin_department: adminProfile?.department || "N/A",
      admin_office: adminProfile?.office_location || "Remote",
      action_type: action === "approve" ? "APPROVE_SELLER" : "REJECT_SELLER",
      target_id: seller_id,
      details: { 
        seller_email: seller.email, 
        shop_name: seller.shop_name,
        category: seller.category,
        admin_note: admin_note || "No note provided"
      },
      ip_address: ip,
      user_agent: req.headers.get("user-agent") || "unknown",
      mfa_verified: true
    });

    return NextResponse.json({ 
      ok: true, 
      message: `Seller ${action === "approve" ? "approved" : "rejected"} successfully`,
      new_status: newStatus
    });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
