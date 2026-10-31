import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, amount, reason } = body;

    // ✅ 1. VERIFY REAL ADMIN AUTH
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error: "Unauthorized: No token provided" }, { status: 401 });
    }
    const token = authHeader.split(" ")[1];

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

    if (!email || !amount || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Invalid email or amount" }, { status: 400 });
    }

    // ✅ 2. FIND USER AND GRANT CREDITS
    const { data: targetUser } = await sbAdmin.from("profiles").select("id, email").eq("email", email).single();
    
    if (!targetUser) {
      return NextResponse.json({ ok: false, error: "User not found" }, { status: 404 });
    }

    // Note: Adjust 'credits' or 'wallet_balance' column name to match your actual schema
    const { error: updateError } = await sbAdmin
      .from("profiles")
      .update({ credits: (targetUser.credits || 0) + Number(amount) })
      .eq("id", targetUser.id);

    if (updateError) throw updateError;

    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // 🛡️ 3. WRITE TO AUDIT LOG
    await sbAdmin.from("admin_audit_logs").insert({
      admin_id: user.id,
      admin_email: user.email,
      action_type: "GRANT_CREDITS",
      target_id: targetUser.id,
      details: { target_email: email, amount_granted: amount, reason: reason || "Admin grant" },
      ip_address: ip
    });

    return NextResponse.json({ 
      ok: true, 
      message: `Successfully granted ${amount} credits to ${email}` 
    });

  } catch (err: any) {
    console.error("Admin credits error:", err);
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
