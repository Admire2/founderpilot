import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Map our carrier names to EasyPost carrier codes
const CARRIER_MAP: Record<string, string> = {
  fedex: "FedEx",
  ups: "UPS",
  usps: "USPS",
  dhl: "DHLExpress",
  "local-courier": "",
};

// Map EasyPost tracking statuses to our timeline stages
const STATUS_MAP: Record<string, string> = {
  pre_transit: "label_created",
  in_transit: "in_transit",
  out_for_delivery: "out_for_delivery",
  delivered: "delivered",
  available_for_pickup: "delivered",
  return_to_sender: "in_transit",
  failure: "in_transit",
  canceled: "label_created",
  error: "in_transit",
  unknown: "in_transit",
};

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { order_id, tracking_number, carrier } = body;

    if (!order_id || !tracking_number || !carrier) {
      return NextResponse.json(
        { ok: false, error: "Missing order_id, tracking_number, or carrier" },
        { status: 400 }
      );
    }

    // Skip local courier (no API tracking)
    if (carrier === "local-courier") {
      return NextResponse.json({ ok: true, message: "Local courier - no API tracking" });
    }

    const easypostCarrier = CARRIER_MAP[carrier.toLowerCase()];
    if (!easypostCarrier) {
      return NextResponse.json({ ok: false, error: "Unsupported carrier" }, { status: 400 });
    }

    const apiKey = process.env.EASYPOST_API_KEY;
    if (!apiKey) {
      console.error("EASYPOST_API_KEY not set in environment");
      return NextResponse.json({ ok: false, error: "Tracking service not configured" }, { status: 500 });
    }

    // 1. Create a tracking object in EasyPost
    const createResponse = await fetch("https://api.easypost.com/v2/trackers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        tracker: {
          tracking_code: tracking_number,
          carrier: easypostCarrier,
        },
      }),
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      console.error("EasyPost create error:", errorText);
      return NextResponse.json(
        { ok: false, error: "Failed to create tracker with carrier" },
        { status: 500 }
      );
    }

    const tracker = await createResponse.json();

    // 2. Build our tracking_stages array from EasyPost data
    const trackingStages: any[] = [];

    // Add the initial "label_created" stage
    if (tracker.created_at) {
      trackingStages.push({
        stage: "label_created",
        time: tracker.created_at,
        location: "Origin Facility",
        description: "Shipping label created",
      });
    }

    // Add each tracking detail from EasyPost
    if (tracker.tracking_details && Array.isArray(tracker.tracking_details)) {
      tracker.tracking_details.forEach((detail: any) => {
        const mappedStage = STATUS_MAP[detail.status] || "in_transit";
        trackingStages.push({
          stage: mappedStage,
          time: detail.datetime || detail.created_at,
          location: detail.tracking_location?.city 
            ? `${detail.tracking_location.city}${detail.tracking_location.state ? `, ${detail.tracking_location.state}` : ""}`
            : detail.tracking_location?.zip || "In Transit",
          description: detail.message || "Status update",
        });
      });
    }

    // Sort by time
    trackingStages.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // Remove duplicates (same stage + same time)
    const uniqueStages = trackingStages.filter((stage, index, self) =>
      index === self.findIndex((s) => s.stage === stage.stage && s.time === stage.time)
    );

    // 3. Update the database
    const updateData: any = {
      tracking_stages: uniqueStages,
      easypost_tracker_id: tracker.id,
    };

    // Update main status based on latest EasyPost status
    if (tracker.status === "delivered") {
      updateData.status = "delivered";
      updateData.delivered_at = new Date().toISOString();
    } else if (tracker.status === "out_for_delivery") {
      updateData.status = "shipped";
    } else if (tracker.status === "in_transit" || tracker.status === "pre_transit") {
      updateData.status = "shipped";
    }

    await supabase
      .from("kara_orders")
      .update(updateData)
      .eq("id", order_id);

    return NextResponse.json({
      ok: true,
      message: "Tracking synced successfully",
      stages_count: uniqueStages.length,
      latest_status: tracker.status,
    });
  } catch (error: any) {
    console.error("Tracking sync error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Internal error" }, { status: 500 });
  }
}
