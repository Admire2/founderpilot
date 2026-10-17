import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function admin() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
}

export async function POST(req: Request) {
  try {
    const url = new URL(req.url);
    const action = url.searchParams.get("action");
    const tool = url.searchParams.get("tool") || "validator";

    const body = await req.json();
    const token = body.access_token;
    if (!token) return NextResponse.json({ count: 0, plan: "free" });

    const a = admin();
    const { data, error } = await a.auth.getUser(token);
    if (error || !data.user) return NextResponse.json({ count: 0, plan: "free" });
    const uid = data.user.id;

    if (action === "record") {
      await a.from("report_usage").insert({ user_id: uid, tool });
    }

    const { count } = await a
      .from("report_usage")
      .select("*", { count: "exact", head: true })
      .eq("user_id", uid)
      .eq("tool", tool);

    const { data: prof } = await a.from("profiles").select("plan, team_id").eq("id", uid).single();

    return NextResponse.json({
      count: count || 0,
      plan: prof?.team_id ? "team" : prof?.plan || "free",
      team_id: prof?.team_id || null,
    });
  } catch {
    return NextResponse.json({ count: 0, plan: "free" });
  }
}