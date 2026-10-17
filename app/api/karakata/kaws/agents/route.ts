import { KAWS_AGENTS } from "@/lib/kaws-agents";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET() {
  return NextResponse.json({ ok: true, agents: KAWS_AGENTS.map(a => ({ id: a.id, name: a.name, icon: a.icon, blurb: a.blurb, inputLabel: a.inputLabel, placeholder: a.placeholder, fields: a.fields || null, vision: !!a.vision })) });
}