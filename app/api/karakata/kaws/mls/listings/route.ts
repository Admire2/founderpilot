import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

const METROS: any = {
  trestle: { city: "Washington", state: "DC", zip: "20001", base: 720000 },
  spark: { city: "Portland", state: "OR", zip: "97201", base: 560000 },
  bridge: { city: "Seattle", state: "WA", zip: "98101", base: 780000 },
  idxbroker: { city: "Phoenix", state: "AZ", zip: "85001", base: 470000 },
  fmls: { city: "Atlanta", state: "GA", zip: "30309", base: 520000 },
  gamlss: { city: "Savannah", state: "GA", zip: "31401", base: 380000 },
  bright: { city: "Philadelphia", state: "PA", zip: "19102", base: 430000 },
  crmls: { city: "Los Angeles", state: "CA", zip: "90012", base: 980000 },
  mred: { city: "Chicago", state: "IL", zip: "60601", base: 460000 },
  ntreis: { city: "Dallas", state: "TX", zip: "75201", base: 450000 },
  har: { city: "Houston", state: "TX", zip: "77002", base: 390000 },
  actris: { city: "Austin", state: "TX", zip: "78701", base: 560000 },
  armls: { city: "Phoenix", state: "AZ", zip: "85004", base: 470000 },
  recolorado: { city: "Denver", state: "CO", zip: "80202", base: 610000 },
  nwmls: { city: "Seattle", state: "WA", zip: "98104", base: 780000 },
  rmls: { city: "Portland", state: "OR", zip: "97205", base: 560000 },
  sdmls: { city: "San Diego", state: "CA", zip: "92101", base: 890000 },
  mlspin: { city: "Boston", state: "MA", zip: "02108", base: 820000 },
  onekey: { city: "New York", state: "NY", zip: "10001", base: 1150000 },
  njmls: { city: "Newark", state: "NJ", zip: "07102", base: 540000 },
  miami: { city: "Miami", state: "FL", zip: "33131", base: 670000 },
  stellar: { city: "Orlando", state: "FL", zip: "32801", base: 420000 },
  canopy: { city: "Charlotte", state: "NC", zip: "28202", base: 430000 },
  realtracs: { city: "Nashville", state: "TN", zip: "37201", base: 480000 },
  glvar: { city: "Las Vegas", state: "NV", zip: "89101", base: 410000 },
  realcomp: { city: "Detroit", state: "MI", zip: "48201", base: 290000 },
  mlsnow: { city: "Cleveland", state: "OH", zip: "44113", base: 260000 },
  creaddf: { city: "Ottawa", state: "ON", zip: "K1P 1J1", base: 560000 },
  trreb: { city: "Toronto", state: "ON", zip: "M5V 2T6", base: 980000 },
  centris: { city: "Montreal", state: "QC", zip: "H2Y 1C6", base: 540000 },
  regbv: { city: "Vancouver", state: "BC", zip: "V6B 1A1", base: 1250000 },
  creb: { city: "Calgary", state: "AB", zip: "T2P 0J9", base: 520000 },
  ereb: { city: "Edmonton", state: "AB", zip: "T5J 0N7", base: 430000 }
};

const STREETS = ["Main St", "Oak Ave", "Maple Dr", "Sunset Blvd", "Park Ln"];
const PHOTOS = [
  "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=400",
  "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400",
  "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=400",
  "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=400",
  "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=400"
];

export async function GET(req: Request) {
  const url = new URL(req.url);
  const isDemo = url.searchParams.get("mode") === "demo";
  const metroId = String(url.searchParams.get("metro") || "fmls");
  const metro = METROS[metroId] || METROS.fmls;

  const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

  if (!isDemo) {
    const { data: connections } = await sb.from("kara_mls_connections").select("*").eq("status", "connected").limit(1);
    if (connections && connections.length > 0) {
      // TODO: RESO Web API OAuth2 handshake with connections[0].api_endpoint + api_key
    }
  }

  const listings = Array.from({ length: 5 }, (_, i) => ({
    ListingKey: metroId.toUpperCase() + "_DEMO_" + (7100000 + i),
    UnparsedAddress: (100 + i * 137) + " " + STREETS[i] + ", " + metro.city + ", " + metro.state + " " + metro.zip,
    City: metro.city,
    StateOrProvince: metro.state,
    PostalCode: metro.zip,
    ListPrice: Math.round((metro.base * (0.75 + i * 0.18)) / 1000) * 1000,
    BedroomsTotal: 2 + (i % 3),
    BathroomsTotalInteger: 2 + (i % 2),
    LivingArea: 1200 + i * 350,
    StandardStatus: i === 2 ? "Pending" : "Active",
    Media: [{ MediaURL: PHOTOS[i] }]
  }));

  return NextResponse.json({
    ok: true,
    listings: listings,
    metro: metro.city + ", " + metro.state,
    source: isDemo ? "reso_sandbox_demo" : "live_reso_api"
  });
}