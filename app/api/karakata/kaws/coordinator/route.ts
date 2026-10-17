import { NextResponse } from "next/server";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const b: any = await req.json().catch(() => ({}));
    const closingDate = new Date(b.closing_date);
    const address = String(b.address || "123 Main St");

    if (isNaN(closingDate.getTime())) {
      return NextResponse.json({ ok: false, error: "Valid closing_date required" }, { status: 400 });
    }

    // Generate a standard 30-day transaction timeline backwards from closing
    const tasks = [
      { days_before: 30, title: "Contract Executed", desc: "All parties signed. Earnest money due.", status: "done" },
      { days_before: 25, title: "Option Period Ends", desc: "Buyer completes inspections. Option fee paid.", status: "done" },
      { days_before: 20, title: "Appraisal Ordered", desc: "Lender orders appraisal. Agent to provide comps.", status: "in_progress" },
      { days_before: 15, title: "Title Search & Commitment", desc: "Title company issues commitment. Review exceptions.", status: "pending" },
      { days_before: 10, title: "Loan Approval", desc: "Lender issues clear-to-close. Review closing disclosure.", status: "pending" },
      { days_before: 3, title: "Final Walkthrough", desc: "Buyer verifies property condition.", status: "pending" },
      { days_before: 0, title: "Closing Day", desc: "Sign documents. Keys released.", status: "pending" }
    ];

    const timeline = tasks.map(t => {
      const d = new Date(closingDate);
      d.setDate(d.getDate() - t.days_before);
      return { ...t, date: d.toISOString().split('T')[0] };
    });

    return NextResponse.json({ ok: true, address, timeline });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: String(e.message) }, { status: 500 });
  }
}