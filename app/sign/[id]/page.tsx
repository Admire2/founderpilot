"use client";
import { useState, useEffect, useRef } from "react";
import { PDFDocument, StandardFonts } from "pdf-lib";
import * as pdfjsLib from "pdfjs-dist";

pdfjsLib.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type Field = { page: number; pdfX: number; pdfY: number; xPct: number; yPct: number; w?: number; wp?: number };

export default function SignerPage() {
  const [doc, setDoc] = useState<any>(null);
  const [docId, setDocId] = useState("");
  const [partyIdx, setPartyIdx] = useState(0);
  const [pages, setPages] = useState<string[]>([]);
  const [myFields, setMyFields] = useState<Field[]>([]);
  const [myColor, setMyColor] = useState("#dc2626");
  const [waiting, setWaiting] = useState(false);
  const [loadError, setLoadError] = useState("");
  const [hasSig, setHasSig] = useState(false);
  const [sigPreview, setSigPreview] = useState("");
  const [drawing, setDrawing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [finished, setFinished] = useState(false);
  const [signedUrl, setSignedUrl] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);

  const sbKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

  useEffect(() => {
    const parts = window.location.pathname.split("/");
    const id = parts[parts.length - 1];
    const q = new URL(window.location.href).searchParams.get("party");
    const me = q ? parseInt(q, 10) : 0;
    setDocId(id); setPartyIdx(me);
    fetch("/api/suite/pilotsign/get?id=" + id).then((r) => r.json()).then((d) => {
      setDoc(d);
      if (d && d.status === "signed") { setDone(true); setFinished(true); return; }
      const parties = d && d.parties ? (typeof d.parties === "string" ? JSON.parse(d.parties) : d.parties) : [];
      if (parties.length > 0) {
        if ((d.next_party || 0) !== me) { setWaiting(true); return; }
        const meP = parties[me];
        setMyColor(meP.color || "#dc2626");
        setMyFields(meP.fields || []);
      }
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.lineWidth = 3; ctx.lineCap = "round"; ctx.lineJoin = "round"; ctx.strokeStyle = "#111";
  }, []);

  useEffect(() => {
    if (!doc || !doc.pdf_url || pages.length > 0) return;
    (async () => {
      try {
        const res = await fetch(doc.pdf_url);
        if (!res.ok) { setLoadError("Vault HTTP " + res.status); return; }
        const buf = await res.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(buf) }).promise;
        const views: string[] = [];
        const fallback: Field[] = [];
        for (let i = 1; i <= pdf.numPages; i++) {
          const page = await pdf.getPage(i);
          const base = page.getViewport({ scale: 1 });
          const scale = 700 / base.width;
          const vp = page.getViewport({ scale: scale });
          const pageFallback: Field[] = [];
          if (myFields.length === 0) {
            const tc = await page.getTextContent();
            tc.items.forEach((it: any) => {
              const t = it.str || "";
              if (/sign here|signature/i.test(t)) {
                const f = { page: i, pdfX: it.transform[4], pdfY: it.transform[5], xPct: it.transform[4] / base.width, yPct: (base.height - it.transform[5]) / base.height, w: Math.min(it.width || 95, 120), wp: Math.min(it.width || 95, 120) / base.width };
                pageFallback.push(f); fallback.push(f);
              }
            });
          }
          const canvas = document.createElement("canvas");
          canvas.width = Math.floor(vp.width); canvas.height = Math.floor(vp.height);
          const ctx = canvas.getContext("2d");
          if (!ctx) continue;
          await page.render({ canvasContext: ctx, viewport: vp }).promise;
          const marks = myFields.length ? myFields.filter((f) => f.page === i) : pageFallback;
          if (marks.length) {
            ctx.strokeStyle = myColor; ctx.lineWidth = 3; ctx.setLineDash([8, 5]);
            marks.forEach((f) => {
              const pt = vp.convertToViewportPoint(f.pdfX, f.pdfY);
              const off = (f.w || 95) * scale;
              ctx.strokeRect(pt[0] + off + 12 * scale, pt[1] - 26 * scale, 330 * scale, 64 * scale);
            });
            ctx.setLineDash([]);
          }
          views.push(canvas.toDataURL("image/png"));
        }
        setPages(views);
        if (myFields.length === 0 && fallback.length > 0) setMyFields(fallback);
      } catch (e: any) { setLoadError("Render error: " + String(e && e.message ? e.message : e)); }
    })();
  }, [doc]);

  const getPos = (e: React.PointerEvent) => { const c = canvasRef.current!; const r = c.getBoundingClientRect(); return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height }; };
  const onDown = (e: React.PointerEvent) => { e.preventDefault(); (e.target as Element).setPointerCapture(e.pointerId); const ctx = canvasRef.current!.getContext("2d")!; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); setDrawing(true); setHasSig(true); };
  const onMove = (e: React.PointerEvent) => { if (!drawing) return; const ctx = canvasRef.current!.getContext("2d")!; const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
  const onUp = () => { setDrawing(false); if (canvasRef.current) setSigPreview(canvasRef.current.toDataURL("image/png")); };
  const clearSig = () => { const canvas = canvasRef.current!; canvas.getContext("2d")!.clearRect(0, 0, canvas.width, canvas.height); setHasSig(false); setSigPreview(""); };

  const jumpTo = (f: Field) => {
    const el = document.getElementById("page-" + f.page);
    if (el && viewerRef.current) viewerRef.current.scrollTo({ top: el.offsetTop - 80, behavior: "smooth" });
  };

  const hexToRgb = (hex: string) => {
    const h = hex.replace("#", "");
    return { type: "RGB", red: parseInt(h.slice(0, 2), 16) / 255, green: parseInt(h.slice(2, 4), 16) / 255, blue: parseInt(h.slice(4, 6), 16) / 255 } as any;
  };

  const applyAll = async () => {
    if (!hasSig) { alert("Please draw your signature first."); return; }
    setBusy(true);
    let ip = ""; let loc = ""; let device = "";
    try { const g = await (await fetch("https://ipapi.co/json/")).json(); ip = g.ip || ""; loc = [g.city, g.region, g.country_name].filter(Boolean).join(", "); } catch (e) {}
    device = typeof navigator !== "undefined" ? navigator.userAgent : "";
    try {
      const res = await fetch(doc.pdf_url);
      const buf = await res.arrayBuffer();
      const pdf = await PDFDocument.load(buf);
      const png = await pdf.embedPng(sigPreview);
      const font = await pdf.embedFont(StandardFonts.Helvetica);
      const now = new Date().toLocaleDateString() + " " + new Date().toLocaleTimeString();
      const col = hexToRgb(myColor);
      const sigW = 140; const sigH = sigW * (png.height / png.width);
      const pdfPages = pdf.getPages();
      if (myFields.length === 0) {
        pdfPages.forEach((p) => { const s = p.getSize(); p.drawImage(png, { x: s.width - sigW - 30, y: 40, width: sigW, height: sigH }); p.drawText("Signed: " + now, { x: s.width - sigW - 30, y: 26, size: 14, font, color: col }); });
      } else {
        myFields.forEach((f) => {
          const p = pdfPages[f.page - 1];
          p.drawImage(png, { x: f.pdfX + (f.w || 95), y: f.pdfY - 2, width: sigW, height: sigH });
          p.drawText("Signed: " + now, { x: f.pdfX + 55, y: f.pdfY - 32, size: 14, font, color: col });
        });
      }
      const out = await pdf.save();
      const signedBlob = new Blob([out as unknown as BlobPart], { type: "application/pdf" });
      const signedPath = "signed-" + docId + "-" + partyIdx + ".pdf";
      const sbUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
      const up = await fetch(sbUrl + "/storage/v1/object/contracts/" + signedPath, { method: "POST", headers: { "Authorization": "Bearer " + sbKey, "apikey": sbKey, "Content-Type": "application/pdf", "x-upsert": "true" }, body: signedBlob });
      if (!up.ok) throw new Error("signed upload HTTP " + up.status);
      const cr = await fetch("/api/suite/pilotsign/complete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: docId, signedPath: signedPath, partyIndex: partyIdx, ip: ip, location: loc, device: device }) });
      const cj = await cr.json(); setFinished(!!cj.finished);
      setDone(true); setBusy(false);
      const url = URL.createObjectURL(signedBlob);
      setSignedUrl(url);
      const a = document.createElement("a"); a.href = url; a.download = "signed-" + (doc.doc_name || "document") + ".pdf";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (e: any) { alert("Error: " + String(e && e.message ? e.message : e)); setBusy(false); }
  };

  if (!doc) return <main className="min-h-screen bg-slate-950 text-white flex items-center justify-center"><p>Loading secure document...</p></main>;
  if (waiting) return <main className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center"><div className="max-w-md text-center bg-yellow-500/10 border border-yellow-500/30 p-10 rounded-2xl"><h1 className="text-2xl font-bold text-yellow-300 mb-4">Not your turn yet ⏳</h1><p className="text-slate-300">You are Party {partyIdx + 1}. Pia will email you automatically the moment the previous party signs.</p></div></main>;
  if (done) return <main className="min-h-screen bg-slate-950 text-white p-8 flex items-center justify-center"><div className="max-w-md text-center bg-emerald-500/10 border border-emerald-500/30 p-10 rounded-2xl">{finished ? <h1 className="text-3xl font-bold text-emerald-300 mb-4">Document Signed & Locked!</h1> : <h1 className="text-3xl font-bold text-cyan-300 mb-4">You Signed! Next party notified ⏳</h1>}<p className="text-slate-300 mb-4">{finished ? "All parties signed - fully executed." : "Your signature is stamped. Pia emailed the next party."}</p><button onClick={() => { const a = document.createElement("a"); a.href = signedUrl || doc.pdf_url; a.download = "signed.pdf"; a.click(); }} className="w-full rounded-xl bg-emerald-500 px-6 py-3 font-bold text-slate-950 hover:bg-emerald-400">Download Copy</button></div></main>;

  return (
    <main className="min-h-screen bg-slate-950 text-white p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-1 bg-white/5 border border-white/10 rounded-2xl p-4 h-fit md:sticky md:top-4">
          <h2 className="font-bold mb-1" style={{ color: myColor }}>Your Signature Blocks ({myFields.length})</h2>
          <p className="text-[10px] text-slate-400 mb-3">Dashed <span style={{ color: myColor }}>box</span> = exactly where your signature lands.</p>
          <div className="space-y-2 max-h-[50vh] overflow-y-auto">
            {myFields.map((f, i) => (
              <button key={i} onClick={() => jumpTo(f)} className="w-full text-left p-2 rounded text-xs bg-slate-800 hover:bg-slate-700">
                Block {i + 1} (Page {f.page})
              </button>
            ))}
            {myFields.length === 0 && pages.length > 0 && <p className="text-xs text-slate-400">No named blocks - you will sign the bottom of every page.</p>}
          </div>
        </div>

        <div className="md:col-span-3 space-y-6">
          <div ref={viewerRef} className="max-h-[60vh] overflow-y-auto rounded-xl border border-white/10 bg-slate-900/60 p-4 space-y-4">
            {loadError && <p className="text-red-300 text-center py-8">{loadError}</p>}
            {!loadError && pages.length === 0 && <p className="text-slate-500 text-center py-8">Scanning document...</p>}
            {pages.map((p, i) => (
              <div key={i} id={"page-" + (i + 1)} className="relative">
                <img src={p} className="w-full rounded shadow" />
                <p className="text-center text-xs text-slate-500 mt-1">Page {i + 1}</p>
              </div>
            ))}
          </div>

          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="font-bold">Draw your signature once</h2>
            <canvas ref={canvasRef} width={500} height={150} onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerLeave={onUp} className="w-full rounded-xl bg-white border-2 border-dashed border-white/20 touch-none cursor-crosshair" />
            <div className="flex gap-4">
              <button onClick={clearSig} className="flex-1 rounded-xl bg-slate-700 px-4 py-3 font-semibold hover:bg-slate-600">Clear</button>
              <button onClick={applyAll} disabled={busy || !hasSig} className="flex-[2] rounded-xl px-6 py-3 font-bold text-white disabled:opacity-50" style={{ backgroundColor: myColor }}>
                {busy ? "Stamping..." : "Apply to My " + myFields.length + " Blocks + Date"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}