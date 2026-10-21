import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
export const dynamic = "force-dynamic";
export async function POST(req: Request) {
  try {
    const b = await req.json();
    const pid = Number(b.pid || 0);
    const name = String(b.name || "");
    const email = String(b.email || "").toLowerCase();
    const message = String(b.message || "");
    if (!pid || !name || !email || !message) return NextResponse.json({ ok: false, error: "All fields required" }, { status: 400 });
    const sb = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_ANON_KEY!);
    let sellerEmail = ""; let shop = "";
    const tables = ["kara_products", "kara_listings", "products"];
    for (const t of tables) {
      let row: any = null;
      try { const r = await sb.from(t).select("*").eq("id", pid).single(); row = r.data; } catch (e) {}
      if (row) {
        sellerEmail = String(row.seller_email || row.email || "").toLowerCase();
        shop = String(row.shop_name || row.title || "");
        if (!sellerEmail && row.seller_id) {
          let s: any = null;
          try { const r2 = await sb.from("sellers").select("*").eq("id", Number(row.seller_id)).single(); s = r2.data; } catch (e) {}
          if (s) { sellerEmail = String(s.email || "").toLowerCase(); shop = shop || String(s.shop_name || ""); }
        }
        break;
      }
    }
    if (!sellerEmail) return NextResponse.json({ ok: false, error: "Seller route not found for this listing" }, { status: 404 });
    await sb.from("kara_emails").insert({
      email: sellerEmail,
      kind: "buyer_relay",
      subject: "Buyer question via KaraKata relay - " + (shop || ("listing #" + pid)),
      body: "<p><b>From:</b> " + name + " (" + email + ")</p><p><b>Listing:</b> #" + pid + "</p><p>" + message.replace(/</g, "&lt;") + "</p><p>Reply through KaraKata only - never share your phone or email with a buyer.</p>",
      status: "queued",
      send_at: new Date().toISOString()
    });
    return NextResponse.json({ ok: true });
  } catch (e: any) { return NextResponse.json({ ok: false, error: String((e && e.message) || e) }, { status: 500 }); }
}
