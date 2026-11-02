import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
  try {
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

    // Fetch all pending sellers
    const { data: sellers, error } = await sbAdmin
      .from("sellers")
      .select("id, email, shop_name, category, created_at, status")
      .eq("status", "pending")
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, sellers: sellers || [] });
  } catch (err: any) {
    return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
  }
}
