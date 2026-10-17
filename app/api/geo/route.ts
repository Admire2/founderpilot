import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(req: Request) {
  const h = req.headers;
  return NextResponse.json({
    country: h.get("x-vercel-ip-country") || "",
    region: h.get("x-vercel-ip-country-region") || "",
    city: h.get("x-vercel-ip-city") || ""
  });
}
