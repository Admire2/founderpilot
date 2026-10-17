import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const text = String(b.text || "").toLowerCase();

    if (text.length < 100) {
      return NextResponse.json({ ok: false, error: "Please paste a full contract or at least 100 characters." }, { status: 400 });
    }

    const risks = [];
    
    // Simple keyword-based risk detection (Mocking AI analysis for now)
    if (!text.includes("inspection") && !text.includes("due diligence")) {
      risks.push({ severity: "high", issue: "Missing Inspection Contingency", advice: "Ensure there is a clear clause allowing the buyer to terminate based on inspection results." });
    }
    if (!text.includes("financing") && !text.includes("loan")) {
      risks.push({ severity: "high", issue: "Missing Financing Contingency", advice: "If the buyer is using a loan, ensure the contract is contingent on loan approval." });
    }
    if (!text.includes("closing date") && !text.includes("settlement")) {
      risks.push({ severity: "medium", issue: "Vague Closing Timeline", advice: "Specify a hard closing date or a 'on or before' date to avoid delays." });
    }
    if (text.includes("as is") && !text.includes("right to inspect")) {
      risks.push({ severity: "medium", issue: "'As-Is' without Inspection Rights", advice: "Even in 'As-Is' sales, the buyer should retain the right to inspect and terminate." });
    }
    if (!text.includes("earnest money") && !text.includes("deposit")) {
      risks.push({ severity: "low", issue: "Earnest Money Not Defined", advice: "Clearly state the amount and holder of the earnest money deposit." });
    }

    if (risks.length === 0) {
      risks.push({ severity: "low", issue: "No Major Red Flags Detected", advice: "Contract looks standard. Always have a licensed attorney review final drafts." });
    }

    return NextResponse.json({ ok: true, risks, word_count: text.split(' ').length });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}