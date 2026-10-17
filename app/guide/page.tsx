"use client";
import Link from "next/link";
import { PDFDocument, StandardFonts } from "pdf-lib";

const guides: [string, string][] = [
  ["Idea Validator", "Type your business idea - get a scored validation report."],
  ["Business Model", "Full canvas: revenue streams, costs, channels."],
  ["Customer Persona", "Your ideal customer profile, pains and triggers."],
  ["Landing Page Copy", "Headline, benefits, CTA - ready to paste."],
  ["Pricing", "A 3-tier pricing strategy for your offer."],
  ["Universal Converter", "Convert images/PDFs between formats."],
  ["Smart Compress / Enlarge", "Shrink or upscale file size and dimensions."],
  ["Image Resizer", "Resize to exact pixels for social media."],
  ["QR Generator", "Turn any link into a QR code image."],
  ["Password Generator", "Create strong random passwords."],
  ["Text & Grammar Checker", "Paste text - download corrected DOC/PDF."],
  ["Letter Writer", "Generate formal letters - download DOC/PDF."],
  ["Name Creator", "Business name ideas + domain availability."],
  ["PilotSign (Remote)", "Upload contract - send secure link - signer scrolls, signs on the X lines - both parties get the locked PDF."],
  ["PilotSign Vault", "Archive with status, timestamps, location, device + downloads."],
  ["Merge PDFs & Images", "Combine many PDFs/JPGs into one master contract."],
];

export default function GuidePage() {
  const downloadPdf = async () => {
    const pdf = await PDFDocument.create();
    const font = await pdf.embedFont(StandardFonts.Helvetica);
    let page = pdf.addPage([612, 792]);
    let y = 740;
    page.drawText("FounderPilot AI - Quick Guide", { x: 50, y, size: 18, font });
    y -= 30;
    for (const [name, desc] of guides) {
      if (y < 60) { page = pdf.addPage([612, 792]); y = 740; }
      page.drawText(name, { x: 50, y, size: 12, font });
      y -= 14;
      const words = desc.split(" ");
      let line = "";
      for (const w of words) {
        if ((line + " " + w).length > 92) { page.drawText(line, { x: 60, y, size: 9, font }); y -= 11; line = w; }
        else line = line ? line + " " + w : w;
      }
      if (line) { page.drawText(line, { x: 60, y, size: 9, font }); y -= 11; }
      y -= 8;
    }
    const out = await pdf.save();
    const blob = new Blob([out as unknown as BlobPart], { type: "application/pdf" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "FounderPilot-Quick-Guide.pdf";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  };

  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <div className="max-w-3xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline mb-6 inline-block">&larr; Back to Suite</Link>
        <h1 className="text-3xl font-bold mb-2">📘 How-To Guide</h1>
        <p className="text-slate-400 mb-6">One-line instructions for every tool. Download the PDF and keep it or share it with your team.</p>
        <button onClick={downloadPdf} className="mb-8 rounded-xl bg-cyan-500 px-6 py-3 font-bold text-slate-950 hover:bg-cyan-400">Download PDF Guide</button>
        <div className="space-y-4">
          {guides.map(([name, desc]) => (
            <div key={name} className="rounded-xl border border-white/10 bg-white/5 p-4">
              <h3 className="font-bold text-cyan-300">{name}</h3>
              <p className="text-sm text-slate-300">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}