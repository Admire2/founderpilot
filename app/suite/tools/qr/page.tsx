"use client";
import { useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { useWallet } from "@/components/useWallet";
import QRCode from "qrcode";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";

const GRIDS: any = { "24 per sheet (4 x 6)": { c: 4, r: 6 }, "12 per sheet (3 x 4)": { c: 3, r: 4 }, "6 per sheet (2 x 3)": { c: 2, r: 3 } };

export default function QRPage() {
  const { spend } = useWallet();
  const [business, setBusiness] = useState("");
  const [slug, setSlug] = useState("");
  const [website, setWebsite] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [facebook, setFacebook] = useState("");
  const [instagram, setInstagram] = useState("");
  const [tiktok, setTiktok] = useState("");
  const [message, setMessage] = useState("");
  const [city, setCity] = useState("");
  const [country, setCountry] = useState("");
  const [grid, setGrid] = useState("24 per sheet (4 x 6)");
  const [shortUrl, setShortUrl] = useState("");
  const [busy, setBusy] = useState(false);

  const createLink = async () => {
    if (!business.trim()) { alert("Enter the business name"); return; }
    if (!website && !phone && !email && !facebook && !instagram && !tiktok && !message) { alert("Add at least one link: website, phone, email, social, or message"); return; }
    setBusy(true);
    try {
      const r = await fetch("/api/qr-create", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ business: business, slug: slug, owner: localStorage.getItem("fp_wallet_email") || "", meta: { website: website, phone: phone, email: email, facebook: facebook, instagram: instagram, tiktok: tiktok, message: message, city: city, country: country } }) });
      const j = await r.json();
      if (j.error) { alert(j.error); setBusy(false); return; }
      if (j.url) setShortUrl(j.url);
    } catch (e) { alert("Could not create link."); }
    setBusy(false);
  };

  const sheet = async () => {
    if (!shortUrl || busy) return;
    setBusy(true);
    try {
      const dataUrl = await QRCode.toDataURL(shortUrl, { width: 300, margin: 1 });
      const ok = await spend(10);
      if (ok) {
        const doc = await PDFDocument.create();
        const page = doc.addPage([595.28, 841.89]);
        const png = await doc.embedPng(dataUrl);
        const font = await doc.embedFont(StandardFonts.Helvetica);
        const dashLine = (x1: number, y1: number, x2: number, y2: number) => {
          const len = Math.hypot(x2 - x1, y2 - y1);
          const on = 3, off = 3;
          const n = Math.floor(len / (on + off));
          for (let k = 0; k <= n; k++) {
            const a = (k * (on + off)) / len;
            const b = Math.min(len, k * (on + off) + on) / len;
            page.drawLine({ start: { x: x1 + (x2 - x1) * a, y: y1 + (y2 - y1) * a }, end: { x: x1 + (x2 - x1) * b, y: y1 + (y2 - y1) * b }, thickness: 0.8, color: rgb(0.55, 0.55, 0.55) });
          }
        };
        const g = GRIDS[grid]; const c = g.c, r = g.r;
        const mw = 20, mh = 20;
        const cw = (595.28 - mw * 2) / c, ch = (841.89 - mh * 2) / r;
        const qrSize = Math.min(cw, ch) * 0.6;
        for (let i = 0; i < c * r; i++) {
          const col = i % c, row = Math.floor(i / c);
          const x = mw + col * cw, y = 841.89 - mh - (row + 1) * ch;
          dashLine(x, y, x + cw, y);
          dashLine(x, y + ch, x + cw, y + ch);
          dashLine(x, y, x, y + ch);
          dashLine(x + cw, y, x + cw, y + ch);
          const qx = x + (cw - qrSize) / 2, qy = y + ch / 2 - qrSize / 2 + 6;
          page.drawImage(png, { x: qx, y: qy, width: qrSize, height: qrSize });
          const tw = font.widthOfTextAtSize(business, 8);
          const loc = [city, country].filter(Boolean).join(", ");
          page.drawText(business, { x: x + (cw - tw) / 2, y: qy - 12, size: 8, font: font, color: rgb(0.15, 0.15, 0.15) });
          if (loc) { const lw = font.widthOfTextAtSize(loc, 6.5); page.drawText(loc, { x: x + (cw - lw) / 2, y: qy - 21, size: 6.5, font: font, color: rgb(0.45, 0.45, 0.45) }); }
        }
        const bytes = await doc.save();
        const blob = new Blob([bytes as any], { type: "application/pdf" });
        const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = business.replace(/\s+/g, "-").toLowerCase() + "-qr-sheet.pdf"; a.click();
      }
    } catch (e) { alert("Sheet failed - try again."); }
    setBusy(false);
  };

  const input = "w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm outline-none focus:border-cyan-400";
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-2xl mx-auto">
        <Link href="/suite" className="text-cyan-400 hover:underline text-sm">&larr; Back to Suite</Link>
        <h1 className="mt-4 text-3xl font-bold">QR Sheet Pro</h1>
        <p className="mt-2 text-sm text-slate-400">One QR = a branded business page (BIG name + socials + actions). No website needed. 10 credits per printable sheet.</p>
        <div className="mt-6 space-y-3">
          <input value={business} onChange={(e) => setBusiness(e.target.value)} placeholder="Business name (BIG BOLD on the scan page + under every QR)" className={input} />
          <input value={slug} onChange={(e) => setSlug(e.target.value)} placeholder="Custom link (optional): go/fred-bunny-realty" className={input} />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <input value={website} onChange={(e) => setWebsite(e.target.value)} placeholder="Website (optional) https://..." className={input} />
            <input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone (optional) +1 555..." className={input} />
            <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email (optional)" className={input} />
            <input value={facebook} onChange={(e) => setFacebook(e.target.value)} placeholder="Facebook link (optional)" className={input} />
            <input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (optional) e.g. Lagos" className={input} />
            <input value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Country (optional) e.g. Nigeria" className={input} />
            <input value={instagram} onChange={(e) => setInstagram(e.target.value)} placeholder="Instagram link (optional)" className={input} />
            <input value={tiktok} onChange={(e) => setTiktok(e.target.value)} placeholder="TikTok link (optional)" className={input} />
          </div>
          <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={2} placeholder="Announcement / message (optional)" className={input} />
          <select value={grid} onChange={(e) => setGrid(e.target.value)} className={input}>
            {Object.keys(GRIDS).map((k) => <option key={k}>{k}</option>)}
          </select>
          <button onClick={createLink} disabled={busy} className="w-full rounded-xl border border-cyan-400/40 bg-cyan-500/10 px-4 py-3 font-bold text-cyan-200 hover:bg-cyan-500/20">1. Create branded business page (free)</button>
          {shortUrl && <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/5 p-4 text-sm"><p className="font-bold text-emerald-300">Branded page ready - open it to preview:</p><p className="break-all text-slate-200">{shortUrl}</p></div>}
          <button onClick={sheet} disabled={!shortUrl || busy} className="w-full rounded-xl bg-cyan-500 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-400 disabled:opacity-40">2. Download printable sheet (-10 credits)</button>
        </div>
      </div>
    </main>
  );
}