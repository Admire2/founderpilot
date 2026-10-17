"use client";
import WalletBar from "@/components/WalletBar";
import { useState } from "react";
import Link from "next/link";
import KaraKataAuthBar from "@/components/KaraKataAuthBar";

const sections = [
  {
    title: "1. Visual & Branding Tools",
    blurb: "Design, resize, and build your brand identity.",
    tools: [
      { name: "Name Creator", desc: "AI brand names with live domain checks.", status: "active", href: "/suite/name-creator", features: ["AI Generation", "Domain Checker"] },
      {  name: "Smart Image Resizer", desc: "Increase/reduce pixels or set exact W x H. Choose PDF or JPG output. 10 credits per operation.", status: "active", href: "/suite/tools/resize", features: ["Scale %", "Exact W x H"]  },
      {  name: "Smart Compress & Enlarge", desc: "Shrink file sizes or upscale for print. Choose PDF or JPG output. 10 credits per operation.", status: "active", href: "/suite/tools/compress", features: ["Quality Slider", "Batch Zip"]  },
      {  name: "QR Code Generator", desc: "Create branded QR codes with business page + printable sheets. 10 credits per sheet.", status: "active", href: "/suite/tools/qr", features: ["PNG Export", "Custom URLs"]  },
      {  name: "Merge PDFs & Images", desc: "Combine multiple PDFs into one master contract. 10 credits per merge.", status: "active", href: "/suite/tools/merge", features: ["Merge PDFs", "Split PDFs"]  },
      { name: "Watermark & Protect", desc: "Add logos or password-protect docs.", status: "waitlist", features: ["Logo watermark", "Password lock"] },
      { name: "Background Remover", desc: "Strip backgrounds from product photos.", status: "waitlist", features: ["AI Cutout", "Transparent PNG"] },
      { name: "AI Image Makers", desc: "Draw pictures from text prompts.", status: "waitlist", features: ["Text to image", "Style presets"] },
      { name: "Image Creator", desc: "Design custom graphics and banners.", status: "waitlist", features: ["Social graphics", "Banners & ads"] },
      { name: "Logo Designers", desc: "Build custom brand art fast.", status: "waitlist", features: ["Custom logos", "Brand kits"] },
    ],
  },
  {
    title: "2. Text & Copywriting Utilities",
    blurb: "Convert, transcribe, and format your content.",
    tools: [
      { name: "Universal Converter", desc: "Convert 30+ file formats (Images, Text).", status: "active", href: "/suite/converter", features: ["30 Formats", "Batch Combine"] },
      { name: "Audio-to-Text", desc: "Transcribe seminars and meetings. Launching with the Credit System.", status: "waitlist", features: ["Whisper AI", "DOC/PDF Export"] },
      { name: "Text-to-Audio", desc: "Turn scripts into human MP3 voiceovers. Launching with the Credit System.", status: "waitlist", features: ["6 Voices", "MP3 Download"] },
      {  name: "Format Changers", desc: "Turn JPG/PNG files into clean PDF documents. 10 credits per conversion.", status: "active", features: ["JPG to PDF", "Batch conversion"]  },
      { name: "Text & Grammar Checker", desc: "Fix spelling and grammar errors instantly.", status: "active", href: "/suite/tools/img2pdf", features: ["Spelling fixes", "Grammar fixes"] },
      { name: "Letter Writer", desc: "Business letters, enquiries, and requests in seconds.", status: "active", href: "/suite/letter-writer", features: ["8 Letter Types", "DOC/PDF Export"] },
      { name: "Translator", desc: "Translate documents into 50+ languages.", status: "waitlist", features: ["50+ languages", "Doc translation"] },
      { name: "AI Writer", desc: "Generate full blogs and books.", status: "waitlist", features: ["Blogs & articles", "Ads & emails"] },
      { name: "AI Copywriters", desc: "Write high-converting sales pages.", status: "waitlist", features: ["Sales pages", "Ad copy"] },
    ],
  },
  {
    title: "3. Business & Finance Calculators",
    blurb: "Crunch the numbers and manage outreach.",
    tools: [
      { name: "Invoice Generator", desc: "Create clean, professional PDF invoices.", status: "waitlist", features: ["Auto Math", "PDF Export"] },
      { name: "ROI & Profit Calculator", desc: "Interactive sliders for business planning.", status: "waitlist", features: ["Margin %", "Break-even"] },
      { name: "eFax via Email", desc: "Send faxes straight from your inbox.", status: "waitlist", features: ["PDF to Fax", "Email Routing"] },
      { name: "Social Schedulers", desc: "Post updates on a timer.", status: "waitlist", features: ["Post timer", "Multi-platform"] },
      { name: "Email Senders", desc: "Send newsletters to clients.", status: "waitlist", features: ["Newsletters", "Client broadcasts"] },
      { name: "Trends Intelligence", desc: "Track market trends in real time.", status: "waitlist", features: ["Market trends", "Competitor alerts"] },
      { name: "Data Scrapers", desc: "Gather market info from the web.", status: "waitlist", features: ["Market info", "Pricing data"] },
    ],
  },
  {
    title: "4. Security & Data",
    blurb: "Protect your accounts and clean your data.",
    tools: [
      { name: "Password Generator", desc: "Generate unhackable passwords locally.", status: "active", href: "/suite/password-generator", features: ["100% Offline", "Custom Rules"] },
      { name: "PilotSign Remote (One Signer)", desc: "Leases, rentals, consents - only the receiver signs.", status: "active", href: "/suite/pilot-sign-solo", features: ["1 Signer", "Magic Links"] },
      { name: "PilotSign Remote (Two Signers)", desc: "Seller signs first, buyer signs second - colors + dates.", status: "active", href: "/suite/pilot-sign", features: ["2 Parties", "Details Box"] },
      { name: "Buy Credit Packs", desc: "Subscriptions ($9/$29/mo) + one-time packs ($9/$25/$45) - from $1.50/envelope.", status: "active", href: "/suite/buy-credits", features: ["Stripe", "Auto Top-up"] },
      { name: "PilotSign Vault", desc: "Locked archive of executed contracts with audit trails.", status: "active", href: "/suite/pilot-docs", features: ["Timestamps", "Geo + Device Trail"] },
      { name: "PilotSign Remote Multi Party Signers", desc: "3+ signers with name-matched blocks and routing (coming soon).", status: "waitlist", href: "/suite", features: ["Name Scan", "Routing"] },
      { name: "E-Sign (Offline)", desc: "Draw your signature and stamp it onto a local PDF.", status: "active", href: "/suite/e-sign", features: ["Draw Signature", "PDF Signing"] },
      { name: "AI Data Extractor (OCR)", desc: "Turn scanned receipts into Excel.", status: "waitlist", features: ["Receipt scan", "PDF to Excel"] },
      { name: "JSON / CSV Formatter", desc: "Clean and validate messy data.", status: "waitlist", features: ["Auto-indent", "Error Check"] },
      { name: "Metadata Stripper", desc: "Remove hidden GPS/author data.", status: "waitlist", features: ["Privacy Guard", "Bulk Clean"] },
      { name: "Basic Storage", desc: "Keep files safe in the cloud.", status: "waitlist", features: ["Cloud vault", "Share links"] },
      { name: "Chatbots", desc: "Answer customer questions 24/7.", status: "waitlist", features: ["24/7 answers", "Lead capture"] },
      { name: "Cloud Code Runners", desc: "Host custom software apps.", status: "waitlist", features: ["Host mini-apps", "Run scripts"] },
    ],
  },
];

function WaitlistButton({ toolName }: { toolName: string }) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  const handleJoin = () => {
    if (!email.includes("@")) return;
    fetch("/api/suite/waitlist", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: email, tool: toolName }) }).catch(() => {});
    setJoined(true);
  };

  if (joined) {
    return <span className="text-center text-xs font-bold text-emerald-400 py-2">✅ Added to Waitlist!</span>;
  }

  return (
    <div className="flex flex-col gap-2 mt-auto">
      <input 
        type="email" 
        placeholder="Enter email for updates" 
        value={email} 
        onChange={(e) => setEmail(e.target.value)}
        className="w-full rounded-lg border border-white/10 bg-slate-900/70 p-2 text-xs text-white outline-none focus:border-cyan-400"
      />
      <button onClick={handleJoin} className="w-full rounded-lg bg-slate-700 hover:bg-slate-600 border border-white/5 px-4 py-2 text-xs font-semibold text-white transition">
        Join Waitlist (Credit System)
      </button>
    </div>
  );
}

export default function BusinessSuite() {
  return (
    <>
      <div className="flex justify-end p-4 bg-slate-900 border-b border-slate-800"><KaraKataAuthBar /></div>
      <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-6xl mx-auto">

        <div className="mb-8 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-cyan-500 text-slate-950 font-bold text-xl shrink-0">🎁</div>
          <div>
            <h2 className="text-xl font-bold text-cyan-300">The FounderPilot Ecosystem</h2>
            <p className="text-slate-300 text-sm">Free starter tools are live! Heavy AI services run on the Credit System - 10 credits per action. Join waitlists below for upcoming tools.</p>
          </div>
        </div>

        <h1 className="text-4xl font-bold mb-2">Business Suite</h1>
        <p className="text-slate-400 mb-10">Your daily operating system for files, documents, and growth.</p>

        {sections.map((section) => (
          <section key={section.title} className="mb-12">
            <h2 className="text-2xl font-bold text-cyan-300 mb-1">{section.title}</h2>
            <p className="text-slate-500 text-sm mb-6">{section.blurb}</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {section.tools.map((tool) => (
                <div key={tool.name} className="rounded-2xl border border-white/10 bg-white/5 p-6 hover:border-cyan-500/50 transition relative flex flex-col">
                  {tool.status === "active" ? (
                    <span className="absolute top-4 right-4 bg-cyan-500 text-slate-950 text-xs font-bold px-2 py-1 rounded-full animate-pulse">LIVE</span>
                  ) : (
                    <span className="absolute top-4 right-4 bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold px-2 py-1 rounded-full">WAITLIST</span>
                  )}
                  <h3 className="text-xl font-semibold mb-2 pr-24">{tool.name}</h3>
                  <p className="text-slate-400 text-sm mb-4">{tool.desc}</p>
                  <div className="mb-6 flex flex-wrap gap-2 content-start">
                    {tool.features.map((f) => (
                      <span key={f} className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] text-slate-400">{f}</span>
                    ))}
                  </div>
                  
                  <div className="mt-auto">
                    {tool.status === "active" ? (
                      <Link href={tool.href || "#"} className="inline-block w-full text-center rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-400 transition">Open Tool</Link>
                    ) : (
                      <WaitlistButton toolName={tool.name} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>
        ))}

        <div className="rounded-2xl border-2 border-dashed border-white/10 p-8 flex flex-col items-center justify-center text-center bg-white/[0.02]">
          <h3 className="text-xl font-semibold mb-2 text-slate-500">Your Idea Could Be Next</h3>
          <p className="text-slate-600 text-sm mb-4">We add new tools AND new capabilities to existing tools every month.</p>
          <Link href="/contact" className="text-cyan-400 text-sm hover:underline font-medium">Request a tool →</Link>
        </div>
      </div>
    </main>
    </>
  );
}
