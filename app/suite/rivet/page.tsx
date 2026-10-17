"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import WalletBar from "@/components/WalletBar";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import JSZip from "jszip";

const CHIPS = ["Bracket for 50kg load on aluminum", "IP67 enclosure for outdoor sensor", "Gear ratio for 12V 100RPM motor", "Heat sink sizing for 50W"];
const DOMAINS = ["Auto-detect (recommended)", "CAD & 3D Modeling", "Stress & FEA", "Enclosures & IP Ratings", "Gears & Kinematics", "Thermal & Fluids", "Material Selection", "Tolerances & Fits", "Hydraulics & Pneumatics", "Robotics & Arms", "Automotive & Chassis", "Aerospace & Drones", "Consumer Products", "Test & Fixtures"];
const SECTION_COLORS: any = { MATERIALS: "border-amber-400/40 bg-amber-500/10 text-amber-200", TOOLS: "border-cyan-400/40 bg-cyan-500/10 text-cyan-200", STEPS: "border-emerald-400/40 bg-emerald-500/10 text-emerald-200", TEST: "border-blue-400/40 bg-blue-500/10 text-blue-200", SAFETY: "border-red-400/40 bg-red-500/10 text-red-200", CONNECTIONS: "border-fuchsia-400/40 bg-fuchsia-500/10 text-fuchsia-200", "RED FLAGS": "border-red-400/50 bg-red-500/15 text-red-200", "AMBER NOTES": "border-amber-400/50 bg-amber-500/15 text-amber-200", "GREEN CHECKS": "border-emerald-400/50 bg-emerald-500/15 text-emerald-200", CHANGES: "border-blue-400/50 bg-blue-500/15 text-blue-200", ASSEMBLY: "border-emerald-400/50 bg-emerald-500/15 text-emerald-200", "MAXI — ELECTRONICS & HARDWARE": "border-cyan-400/50 bg-cyan-500/15 text-cyan-200", "RIVET — MECHANICAL": "border-slate-400/50 bg-slate-500/15 text-slate-200", "VOLT — ELECTRICAL POWER": "border-yellow-400/50 bg-yellow-500/15 text-yellow-200", "TERRA — CIVIL & STRUCTURAL": "border-green-400/50 bg-green-500/15 text-green-200", TIMELINE: "border-blue-400/50 bg-blue-500/15 text-blue-200", HANDOFFS: "border-fuchsia-400/50 bg-fuchsia-500/15 text-fuchsia-200" };
const TAG_COLORS: any = { POWER: "bg-red-500/20 text-red-300 border-red-500/40", IC: "bg-purple-500/20 text-purple-300 border-purple-500/40", PASSIVE: "bg-blue-500/20 text-blue-300 border-blue-500/40", PCB: "bg-green-500/20 text-green-300 border-green-500/40", MECH: "bg-slate-500/20 text-slate-300 border-slate-500/40", CONN: "bg-yellow-500/20 text-yellow-300 border-yellow-500/40", RED: "bg-red-500/25 text-red-200 border-red-500/50", AMBER: "bg-amber-500/25 text-amber-200 border-amber-500/50", GREEN: "bg-emerald-500/25 text-emerald-200 border-emerald-500/50" };

function sectionRows(text: string, name: string) {
  const lines = text.split("\n");
  let on = false; const out: any[] = [];
  for (const l of lines) {
    const t = l.trim();
    const h = t.replace(/^[\s\*]+/, "");
    if (h.indexOf("## ") === 0) { on = h.replace("## ", "").toUpperCase().indexOf(name) === 0; continue; }
    if (on && t.indexOf("->") > 0 && t.length < 140) {
      const cl = t.replace(/^[\s\d\.\-\*]+/, "").replace(/\*\*/g, "");
      const m = cl.match(/^(.*?)\s*->\s*(.*?)\s*:\s*(.*)$/);
      if (m) out.push({ a: m[1].replace(/\*/g, "").slice(0, 28), b: m[2].replace(/\*/g, "").slice(0, 28), label: m[3].replace(/\*/g, "").slice(0, 40) });
    }
  }
  return out;
}

function connRows(text: string) {
  return text.split("\n").map((l) => l.trim().replace(/^-\s*/, "")).filter((l) => l.indexOf("->") > 0 && l.length < 140).map((l) => { const m = l.replace(/^[\s\d\.\-\*]+/, "").match(/^(.*?)\s*->\s*(.*?)\s*:\s*(.*)$/); return m ? { a: m[1].replace(/\*/g, "").slice(0, 28), b: m[2].replace(/\*/g, "").slice(0, 28), label: m[3].replace(/\*/g, "").slice(0, 40) } : null; }).filter(Boolean) as any[];
}

function blockRows(text: string) {
  const rows: string[][] = [];
  for (const line of text.split("\n")) {
    const t = line.trim();
    const toks = t.match(/\[([^\]]+)\]/g);
    if (toks && toks.length >= 2 && (t.indexOf("->") > 0 || t.indexOf("→") > 0)) rows.push(toks.map((x) => x.slice(1, -1).slice(0, 22)));
  }
  return rows;
}

function BlockDiagram({ rows }: { rows: string[][] }) {
  const W = 640, rowH = 46, boxH = 30;
  return (
    <svg viewBox={"0 0 " + W + " " + (rows.length * rowH + 8)} className="mt-2 w-full">
      {rows.map((toks, i) => {
        const y = i * rowH + 12;
        const n = toks.length;
        const boxW = Math.max(90, Math.min(180, (W - 40 - (n - 1) * 30) / n));
        return (
          <g key={i}>
            {toks.map((tk, j) => {
              const bx = 20 + j * (boxW + 30);
              return (
                <g key={j}>
                  <rect x={bx} y={y} width={boxW} height={boxH} rx={6} fill="rgba(34,211,238,0.12)" stroke="rgba(34,211,238,0.5)" />
                  <text x={bx + 8} y={y + 19} fill="#a5f3fc" fontSize="10">{tk}</text>
                  {j < n - 1 && <line x1={bx + boxW} y1={y + 15} x2={bx + boxW + 30} y2={y + 15} stroke="#22d3ee" strokeWidth="2" />}
                </g>
              );
            })}
          </g>
        );
      })}
    </svg>
  );
}

function Wiring({ rows }: { rows: any[] }) {
  const rowH = 52, W = 640, boxW = 210;
  const NET = ["#e879f9", "#22d3ee", "#34d399", "#fbbf24", "#f87171", "#a78bfa", "#f472b6", "#4ade80"];
  const netColor = (s: string) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 997; return NET[h % NET.length]; };
  const split = (s: string) => { const i = s.indexOf(":"); return i > 0 ? { c: s.slice(0, i), p: s.slice(i + 1) } : { c: s, p: "" }; };
  return (
    <svg viewBox={"0 0 " + W + " " + (rows.length * rowH + 8)} className="mt-2 w-full">
      {rows.map((r, i) => {
        const y = i * rowH + 20;
        const A = split(r.a), B = split(r.b);
        const nc = netColor(r.label);
        return (
          <g key={i}>
            <rect x={10} y={y} width={boxW} height={34} rx={6} fill="rgba(34,211,238,0.10)" stroke="rgba(34,211,238,0.5)" />
            <text x={20} y={y + 15} fill="#a5f3fc" fontSize="11" fontWeight="bold">{A.c}</text>
            {A.p !== "" && <text x={20} y={y + 28} fill="#67e8f9" fontSize="9">pin {A.p}</text>}
            <rect x={W - boxW - 10} y={y} width={boxW} height={34} rx={6} fill="rgba(52,211,153,0.10)" stroke="rgba(52,211,153,0.5)" />
            <text x={W - boxW} y={y + 15} fill="#a7f3d0" fontSize="11" fontWeight="bold">{B.c}</text>
            {B.p !== "" && <text x={W - boxW} y={y + 28} fill="#6ee7b7" fontSize="9">pin {B.p}</text>}
            <line x1={10 + boxW} y1={y + 17} x2={W - boxW - 10} y2={y + 17} stroke={nc} strokeWidth="2.5" />
            <circle cx={10 + boxW} cy={y + 17} r={3} fill={nc} />
            <circle cx={W - boxW - 10} cy={y + 17} r={3} fill={nc} />
            <text x={W / 2} y={y + 10} fill={nc} fontSize="10" textAnchor="middle" fontWeight="bold">{r.label}</text>
          </g>
        );
      })}
    </svg>
  );
}

function PcbPreview({ text }: { text: string }) {
  const names: string[] = [];
  const seen: any = {};
  for (const r of sectionRows(text, "CONNECTIONS")) {
    for (const s of [r.a, r.b]) {
      const c = s.split(":")[0].trim();
      if (!seen[c] && c.toUpperCase() !== "GND" && names.length < 24) { seen[c] = 1; names.push(c); }
    }
  }
  const n = Math.max(names.length, 1);
  const cols = Math.ceil(Math.sqrt(n));
  const cell = 92, bw = 62, bh = 40;
  const W = cols * cell + 60, Hh = Math.ceil(n / cols) * 82 + 60;
  return (
    <div className="mt-2 overflow-x-auto rounded-lg bg-slate-950 p-2">
      <svg viewBox={"0 0 " + W + " " + Hh} className="w-full">
        <rect x={8} y={8} width={W - 16} height={Hh - 16} rx={10} fill="#0d7a3f" stroke="#e8e8e8" strokeWidth="2" />
        {[[22, 22], [W - 22, 22], [22, Hh - 22], [W - 22, Hh - 22]].map((p, i) => <circle key={i} cx={p[0]} cy={p[1]} r={5} fill="#f7d774" stroke="#8a6d1a" />)}
        {names.map((nm, i) => {
          const cx = 34 + (i % cols) * cell + bw / 2, cy = 34 + Math.floor(i / cols) * 82 + bh / 2;
          return (
            <g key={nm}>
              <rect x={cx - bw / 2} y={cy - bh / 2} width={bw} height={bh} rx={3} fill="#2b2b2b" stroke="#d9d9d9" strokeWidth="1" />
              <circle cx={cx - bw / 2 + 6} cy={cy - bh / 2 + 6} r={2} fill="#f7d774" />
              <text x={cx} y={cy + 3} fontSize="7" fill="#ffffff" textAnchor="middle">{nm.slice(0, 14)}</text>
              <text x={cx} y={cy + bh / 2 + 9} fontSize="6" fill="#e8e8e8" textAnchor="middle">SMT</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function SchematicSheet({ text }: { text: string }) {
  const rows = sectionRows(text, "CONNECTIONS");
  if (!rows.length) return null;
  const split = (s: string) => { const i = s.indexOf(":"); return i > 0 ? { c: s.slice(0, i).trim(), p: s.slice(i + 1).trim() } : { c: s, p: "" }; };
  const comps: any = {}; const order: string[] = [];
  const ensure = (n: string) => { if (!comps[n]) { comps[n] = { left: [], right: [] }; order.push(n); } return comps[n]; };
  const wires: any[] = [];
  rows.forEach((r, idx) => {
    const A = split(r.a), B = split(r.b);
    const aG = (A.p + " " + A.c).toUpperCase().indexOf("GND") >= 0;
    const bG = (B.p + " " + B.c).toUpperCase().indexOf("GND") >= 0;
    const ca = ensure(A.c), cb = ensure(B.c);
    if (bG && !aG) { ca.right.push({ pin: A.p, gnd: true }); return; }
    if (aG && !bG) { cb.left.push({ pin: B.p, gnd: true }); return; }
    if (aG && bG) { ca.right.push({ pin: A.p, gnd: true }); cb.left.push({ pin: B.p, gnd: true }); return; }
    ca.right.push({ pin: A.p }); cb.left.push({ pin: B.p });
    wires.push({ ac: A.c, bc: B.c, ai: ca.right.length - 1, bi: cb.left.length - 1, label: r.label, idx: idx });
  });
  const colW = 350, boxW = 230, pinH = 16, cols = 2;
  const pos: any = {}; const rowHs: number[] = [];
  order.forEach((n, i) => {
    const c = comps[n];
    const pinsN = Math.max(c.left.length, c.right.length, 3);
    const h = pinsN * pinH + 26;
    const row = Math.floor(i / cols);
    pos[n] = { col: i % cols, row: row, h: h };
    rowHs[row] = Math.max(rowHs[row] || 0, h + 70);
  });
  const yOf = (row: number) => { let y = 16; for (let i = 0; i < row; i++) y += rowHs[i]; return y; };
  order.forEach((n) => { pos[n].x = 30 + pos[n].col * colW; pos[n].y = yOf(pos[n].row); });
  const H = yOf(rowHs.length) + 10, W = 30 + cols * colW + 10;
  const NET = ["#0a7a3a", "#b00020", "#0057b7", "#7a007a", "#b26a00", "#00727a", "#5a5a5a", "#c2417a"];
  const gndSym = (x: number, y: number, dir: number, key: string) => (
    <g key={key}>
      <line x1={x} y1={y} x2={x + 14 * dir} y2={y} stroke="#7a0000" strokeWidth="1.5" />
      <polygon points={(x + 14 * dir) + "," + (y - 5) + " " + (x + 14 * dir) + "," + (y + 5) + " " + (x + 22 * dir) + "," + y} fill="none" stroke="#7a0000" strokeWidth="1.5" />
      <text x={x + 26 * dir} y={y + 3} fontSize="8" fill="#7a0000" textAnchor={dir < 0 ? "end" : "start"}>GND</text>
    </g>
  );
  return (
    <div className="mt-2 overflow-x-auto rounded-lg bg-white p-2">
      <svg viewBox={"0 0 " + W + " " + H} className="w-full">
        {order.map((n) => {
          const p = pos[n]; const c = comps[n];
          return (
            <g key={n}>
              <rect x={p.x} y={p.y} width={boxW} height={p.h} rx={4} fill="#f8f8d8" stroke="#7a4a4a" strokeWidth="1.5" />
              <text x={p.x + boxW / 2} y={p.y + p.h - 6} fontSize="10" fontWeight="bold" fill="#333" textAnchor="middle">{n}</text>
              {c.left.map((pn: any, i: number) => {
                const y = p.y + 14 + i * pinH;
                return (
                  <g key={"l" + i}>
                    <text x={p.x + 6} y={y + 3} fontSize="8" fill="#444">{pn.pin}</text>
                    {pn.gnd ? gndSym(p.x, y, -1, "gl" + i) : <line x1={p.x - 10} y1={y} x2={p.x} y2={y} stroke="#0a7a3a" strokeWidth="1.5" />}
                  </g>
                );
              })}
              {c.right.map((pn: any, i: number) => {
                const y = p.y + 14 + i * pinH;
                return (
                  <g key={"r" + i}>
                    <text x={p.x + boxW - 6} y={y + 3} fontSize="8" fill="#444" textAnchor="end">{pn.pin}</text>
                    {pn.gnd ? gndSym(p.x + boxW, y, 1, "gr" + i) : <line x1={p.x + boxW} y1={y} x2={p.x + boxW + 10} y2={y} stroke="#0a7a3a" strokeWidth="1.5" />}
                  </g>
                );
              })}
            </g>
          );
        })}
        {wires.map((w) => {
          const pa = pos[w.ac], pb = pos[w.bc];
          if (!pa || !pb) return null;
          const ax = pa.x + boxW + 10, ay = pa.y + 14 + w.ai * pinH;
          const bx = pb.x - 10, by = pb.y + 14 + w.bi * pinH;
          const nc = NET[w.idx % NET.length];
          const mx = ax + 14;
          return (
            <g key={"w" + w.idx}>
              <path d={"M " + ax + " " + ay + " L " + mx + " " + ay + " L " + mx + " " + by + " L " + bx + " " + by} fill="none" stroke={nc} strokeWidth="1.5" />
              <text x={(ax + bx) / 2} y={Math.min(ay, by) - 4} fontSize="8" fill={nc} textAnchor="middle" fontWeight="bold">{w.label}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function ReportView({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <div className="space-y-2">
      {lines.map((line, i) => {
        const t = line.trim();
        if (!t) return null;
        const h = t.replace(/^[\s\*]+/, "");
        if (h.indexOf("## ") === 0) {
          const name = h.replace("## ", "").toUpperCase();
          const cls = SECTION_COLORS[name] || "border-white/10 bg-white/5 text-slate-200";
          return <div key={i} className={"mt-4 rounded-lg border px-3 py-2 text-sm font-bold " + cls}>{name}</div>;
        }
        if (t.indexOf("- ") === 0) {
          const tagMatch = t.match(/\[([A-Z]+)\]/);
          const tag = tagMatch ? tagMatch[1] : null;
          const rest = t.substring(2).replace(/\[[A-Z]+\]\s*/, "");
          return (
            <div key={i} className="flex items-start gap-2 pl-3 text-sm text-slate-200">
              {tag && <span className={"mt-0.5 shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-bold " + (TAG_COLORS[tag] || "bg-white/10 text-slate-300 border-white/10")}>{tag}</span>}
              <span>{rest}</span>
            </div>
          );
        }
        if (/^STEP\s*\d/i.test(t)) {
          const stepNo = (t.match(/STEP\s*\d+/i) || ["STEP"])[0];
          return (
            <div key={i} className="flex items-start gap-2 pl-3 text-sm text-slate-100">
              <span className="mt-0.5 shrink-0 rounded-full border border-emerald-500/40 bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">{stepNo}</span>
              <span>{t.replace(/STEP\s*\d+:\s*/i, "")}</span>
            </div>
          );
        }
        return <p key={i} className="pl-3 text-sm text-slate-300">{t}</p>;
      })}
    </div>
  );
}

const scoreSuites = (q: any) => {
  const s = String(q || "").toLowerCase();
  const hits = (arr: any[]) => arr.reduce((n: any, k: any) => n + (s.indexOf(k) >= 0 ? 1 : 0), 0);
  const raw = [
    hits(["pcb", "firmware", "sensor", "mcu", "radio", "telemetry", "schematic", "component", "iot", "drone", "robot", "antenna", "camera"]),
    hits(["frame", "bracket", "enclosure", "gear", "mount", "cad", "stress", "material", "propeller", "mechanism", "housing", "drone", "robot", "arm", "chassis"]),
    hits(["battery", "power", "solar", "cable", "voltage", "current", "bms", "earthing", "panel", "amp", "drone", "robot", "motor", "charger"]),
    hits(["foundation", "concrete", "structural", "building", "mast", "tower", "seismic", "wind load", "drainage", "site", "bridge", "road", "roof"])
  ];
  const tot = raw[0] + raw[1] + raw[2] + raw[3];
  let pct = [30, 30, 30, 10];
  if (tot > 0) {
    pct = raw.map((x) => Math.round((x / tot) * 100));
    const diff = 100 - (pct[0] + pct[1] + pct[2] + pct[3]);
    pct[pct.indexOf(Math.max(pct[0], pct[1], pct[2], pct[3]))] += diff;
  }
  return pct;
};
let LASTIMG = ""; let LASTCHIP = ""; let LASTBRIEF = "";
let CURRENT_CODE = "US"; let SKIP_PLAN_CHARGE = false;
const CODE_OPTIONS = [
  { id: "US", label: "US (IBC/ASCE/AISC/ACI · imperial)" },
  { id: "EUROCODE", label: "Eurocode (EN · metric)" },
  { id: "UK", label: "UK (BS+EN · metric)" },
  { id: "AU", label: "Australia (AS/NZS · metric)" },
  { id: "CA", label: "Canada (NBC/CSA · metric)" },
  { id: "IN", label: "India (IS · metric)" },
];
export default function RivetPage() {
  const [complexity, setComplexity] = useState<"simple" | "complex">("simple");
  const [codeSys, setCodeSys] = useState("US");
  const [freeChangeUsed, setFreeChangeUsed] = useState(false);
  const regenPlan = (cs: string) => { CURRENT_CODE = cs; SKIP_PLAN_CHARGE = true; const b = Array.from(document.querySelectorAll("button")).find(x => (x.textContent || "").includes("Start Designing")); if (b) (b as HTMLButtonElement).click(); SKIP_PLAN_CHARGE = false; };
  const onCodeChange = async (e: any) => { const next = e.target.value; if (next === codeSys) return; if (!freeChangeUsed) { setFreeChangeUsed(true); setCodeSys(next); regenPlan(next); } else { chargeCredits(5, "code_change"); setCodeSys(next); regenPlan(next); } };
    const imgBase = () => {
    try {
      const fi = document.querySelector('input[type=file]') as HTMLInputElement | null;
      if (fi && fi.value) {
        let n = (fi.value.split('\\').pop() || "");
        n = n.replace(/\s*\(\d+\)/g, "").replace(/\.[^.]+$/, "").trim();
        return n;
      }
    } catch (e) {}
    return "";
  };
  const clearAll = () => { setPlan(""); setAnswer(""); setReport(""); setReview(""); };

useEffect(() => { CURRENT_CODE = codeSys; }, [codeSys]);
  // QUICK-ASK-METER
useEffect(() => {
  const onClick = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest("button");
    if (!t) return;
    const txt = (t.textContent || "").toLowerCase();
    if (txt.includes("⚡") || txt.includes("quick ask")) { if (complexity === "complex") { alert("Quick asks are for simple projects only. For complex systems use the full workflow: Brief -> Plan -> Design."); return; } if (txt && txt !== LASTCHIP) clearAll(); if (txt) LASTCHIP = txt; chargeCredits(15, "design_quick"); }
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}, []);
  // SUITE-EXPORT-METER
useEffect(() => {
  const onClick = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest("button");
    if (!t) return;
    const txt = (t.textContent || "").toLowerCase();
    if (txt.includes("freecad") || txt.includes("outputs")) chargeCredits(5, "export");
    else if (txt.includes("print pack")) chargeCredits(5, "print_pack"); saveServer({ brief: q, design: answer, report: report, build: true }); window.dispatchEvent(new Event("fp-snap-updated")); try { const k = "fp_snap_" + (window.location.pathname.split("/")[2] || "suite"); const sv = localStorage.getItem(k); if (sv) { const j2 = JSON.parse(sv); j2.build = true; j2.buildTs = new Date().toISOString(); localStorage.setItem(k, JSON.stringify(j2)); } else { localStorage.setItem(k, JSON.stringify({ ts: new Date().toISOString(), q: ((document.querySelector("textarea") as HTMLTextAreaElement | null) || { value: "" }).value, answer: "", build: true, buildTs: new Date().toISOString() })); } } catch (e) {}
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}, []);
  const chargeCredits = async (cost: number, action: string) => {
    try {
      let em = "";
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
          const j = JSON.parse(localStorage.getItem(k) || "null");
          em = (j && j.user && j.user.email) || (j && j.currentSession && j.currentSession.user && j.currentSession.user.email) || "";
          if (em) break;
        }
      }
      if (!em) { try { em = localStorage.getItem("fp_wallet_email") || ""; } catch (e) {} }
      if (em) {
        const r = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, cost, action }) });
        const j = await r.json();
        if (j && j.newBalance !== undefined) window.dispatchEvent(new CustomEvent("wallet-updated", { detail: { balance: j.newBalance } }));
      }
    } catch (e) {}
  };

  // TASK-METER-LISTENER
useEffect(() => {
  const doCharge = async (cost: number, action: string) => {
    try {
      let em = "";
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i) || "";
        if (k.startsWith("sb-") && k.endsWith("-auth-token")) {
          const j = JSON.parse(localStorage.getItem(k) || "null");
          em = (j && j.user && j.user.email) || (j && j.currentSession && j.currentSession.user && j.currentSession.user.email) || "";
          if (em) break;
        }
      }
      if (!em) { try { em = localStorage.getItem("fp_wallet_email") || ""; } catch (e) {} }
      if (em) {
        const r = await fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, cost, action }) });
        const j = await r.json();
        if (j && j.newBalance !== undefined) window.dispatchEvent(new CustomEvent("wallet-updated", { detail: { balance: j.newBalance } }));
      }
    } catch (e) {}
  };
  const onClick = (e: MouseEvent) => {
    const t = (e.target as HTMLElement).closest("button");
    if (!t) return;
    const txt = (t.textContent || "").toLowerCase();
    if (txt.includes("start designing")) doCharge(15, "design");
    else if (txt.includes("team plan")) doCharge(10, "team");
    else if (txt.includes("generate report")) doCharge(5, "report");
    else if (txt.includes("design review")) doCharge(10, "review");
  };
  document.addEventListener("click", onClick);
  return () => document.removeEventListener("click", onClick);
}, []);
  useEffect(() => {
    const h = (e: any) => {
      const t = e.target && e.target.closest ? (e.target as any).closest("a,button") : null;
      if (!t) return;
      const x = t.textContent || "";
      if (/Find a Partner|Generate Vendor List|Certified Partner|Partners/i.test(x)) {
        e.preventDefault(); e.stopPropagation();
        alert("We are still working on assembling a database of certified partners & vendors - this service is not ready yet at this time. Check back soon!");
      }
    };
    document.addEventListener("click", h, true);
    return () => document.removeEventListener("click", h, true);
  }, []);
  const [domain, setDomain] = useState("Auto-detect (recommended)");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState(false);
  const [answer, setAnswer] = useState("");
  const [provider, setProvider] = useState("");
  const [stamp, setStamp] = useState("");
  const [report, setReport] = useState("");
  const [reportBusy, setReportBusy] = useState(false);
  const [plan, setPlan] = useState("");
  const [planBusy, setPlanBusy] = useState(false);
  const [rev, setRev] = useState(0);
  const [revNote, setRevNote] = useState("");
  const [showRev, setShowRev] = useState(false);
  const [team, setTeam] = useState("");
  const [teamBusy, setTeamBusy] = useState(false);
  const [gtab, setGtab] = useState("SCH");
  const [showDiy, setShowDiy] = useState(false);
  const [review, setReview] = useState("");
  const [reviewBusy, setReviewBusy] = useState(false);
  const [qbEnv, setQbEnv] = useState("");
  const [qbBudget, setQbBudget] = useState("");
  const [qbVolume, setQbVolume] = useState("");
  const [qbCerts, setQbCerts] = useState("");
  const [qbProd, setQbProd] = useState("");
  const [vendor, setVendor] = useState("");
  const [vendorBusy, setVendorBusy] = useState(false);
  const [snap, setSnap] = useState<any>(null);
  const [pid, setPid] = useState("");
  const [projects, setProjects] = useState<any[]>([]);
  const [codeInput, setCodeInput] = useState("");

  useEffect(() => { try { const sv = localStorage.getItem("fp_snap_rivet"); if (sv) setSnap(JSON.parse(sv)); } catch (e) {} }, []);
  const ensurePid = () => { let c = ""; try { c = localStorage.getItem("fp_pid_rivet") || ""; } catch (e) {} if (!c) { const t = Date.now().toString().slice(-10); let r = ""; for (let i = 0; i < 6; i++) { r += Math.floor(Math.random() * 10); } const raw = (t + r).slice(0, 16); c = raw.slice(0, 4) + "-" + raw.slice(4, 8) + "-" + raw.slice(8, 12) + "-" + raw.slice(12, 16); try { localStorage.setItem("fp_pid_rivet", c); } catch (e) {} } return c; };
  const saveServer = async (extra: any) => { try { let em = ""; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.startsWith("sb-") && k.endsWith("-auth-token")) { const j3 = JSON.parse(localStorage.getItem(k) || "null"); em = (j3 && j3.user && j3.user.email) || ""; if (em) break; } } let dv = ""; try { dv = localStorage.getItem("fp_device_id") || ""; } catch (e) {} await fetch("/api/snapshot", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.assign({ code: ensurePid(), email: em, suite: "rivet", device: dv }, extra)) }); } catch (e) {} };
  const restoreByCode = async (code: string) => { try { const r = await fetch("/api/snapshot?code=" + encodeURIComponent(code.replace(/[^0-9-]/g, ""))); const j4 = await r.json(); if (j4.row) { setQ(j4.row.brief || ""); setAnswer(j4.row.design_text || ""); setReport(j4.row.report_text || ""); setPlan(j4.row.plan_text || ""); setPid(j4.row.project_code); try { localStorage.setItem("fp_pid_rivet", j4.row.project_code); localStorage.setItem("fp_snap_rivet", JSON.stringify({ ts: j4.row.updated_at_et, q: j4.row.brief, answer: j4.row.design_text, build: j4.row.build_done })); } catch (e) {} setSnap(null); alert("Project restored WORD-FOR-WORD from your cloud save."); } else { alert("No project found for that code."); } } catch (e) { alert("Restore failed - check connection."); } };
  useEffect(() => { try { const c0 = localStorage.getItem("fp_pid_rivet"); if (c0) setPid(c0); } catch (e) {} (async () => { try { let em = ""; for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.startsWith("sb-") && k.endsWith("-auth-token")) { const j5 = JSON.parse(localStorage.getItem(k) || "null"); em = (j5 && j5.user && j5.user.email) || ""; if (em) break; } } if (em) { const r = await fetch("/api/snapshot?email=" + encodeURIComponent(em)); const j6 = await r.json(); setProjects(j6.rows || []); } } catch (e) {} })(); }, []);
  const ask = async (text: string) => {
    if (!text.trim() || busy) return;
    setBusy(true); setAnswer(""); setReport(""); setReview("");
    try {
      const r = await fetch("/api/rivet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: text, domain: domain }) });
      const j = await r.json();
      setAnswer(j.answer || "No response."); setPid(ensurePid()); saveServer({ brief: text, design: j.answer || "" }); window.dispatchEvent(new Event("fp-snap-updated")); try { localStorage.setItem("fp_snap_rivet", JSON.stringify({ ts: new Date().toISOString(), q: text, answer: j.answer || "" })); } catch (e) {}
      setProvider(j.provider || "");
      setStamp(new Date().toLocaleString());
      setTimeout(() => { const el = document.getElementById("design-card"); if (el) el.scrollIntoView({ behavior: "smooth", block: "start" }); }, 300);
    } catch (e) { setAnswer("Rivet hit a connection issue - try again."); }
    setBusy(false);
  };

  const changeCodeSys = async (v: string) => { if (v === codeSys) return; if (freeChangeUsed) { chargeCredits(5, "code-change"); } else { setFreeChangeUsed(true); } setCodeSys(v); CURRENT_CODE = v; if (plan || answer) { setPlanBusy(true); setBusy(true); try { const prompt = plan ? "RECALCULATE IN NEW CODE SYSTEM. Keep the same client intent. Output: #Goal, #Implementation plan." : "RECALCULATE IN NEW CODE SYSTEM. Keep the same client intent. Produce full engineering design with ## CONNECTIONS and ## ASSEMBLY sections."; const r = await fetch("/api/rivet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt + "\n\nORIGINAL:\n" + (plan || answer) + "\n\n[NEW CODE SYSTEM: " + v + "] Recalculate all values in this code/unit system.", domain: domain }) }); const j = await r.json(); const t = j.answer || ""; if (plan) setPlan(t); else setAnswer(t); } catch (err) { alert("Recalculation failed: " + (err as any).message); } setPlanBusy(false); setBusy(false); } };
  const makePlan = async () => {
    if (!q.trim()) { alert("Write the client project / task in the top box first"); return; }
    chargeCredits(5, "plan"); const bt = ((document.querySelector("textarea") as HTMLTextAreaElement | null)?.value.trim() || ""); if (LASTBRIEF && bt && bt !== LASTBRIEF) clearAll(); setPlanBusy(true); setPlan("");
    const prompt = "PLAN MODE. Client project brief: " + q + "\nProject constraints: Environment & use: " + (qbEnv || "unspecified") + " | Target unit cost: " + (qbBudget || "unspecified") + " | Production volume: " + (qbVolume || "unspecified") + " | Certifications & standards: " + (qbCerts || "unspecified") + " | Production type: " + (qbProd || "unspecified") + ".\nIf production type is Prototype, favor hand-solder-friendly parts and breakout modules. If Volume production, favor reel-packed parts, DFM notes and test-jig planning.\nOutput exactly two sections. First line '#Goal' then a one-paragraph goal. Then line '#Implementation plan' then numbered steps (1., 1.1, 1.2, 2., 2.1...). Tailor component choices to volume and budget, environment (IP rating, temperature range), and certifications (compliance path). Mention example core components (MCU, sensor, power IC, radio). Keep it short and approval-ready. No extra commentary.";
    try {
      const r = await fetch("/api/rivet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt + "\n\n[CLIENT SELECTED CODE SYSTEM: " + CURRENT_CODE + "]", domain: domain }) });
      const j = await r.json();
      const t = j.answer || "";
      if (!t || t.indexOf("All AI providers") >= 0) { setPlan(""); alert("Rivet's brains are busy right now - wait about 60 seconds and press Start Designing again."); } else { setPlan(t); LASTBRIEF = ((document.querySelector("textarea") as HTMLTextAreaElement | null)?.value.trim() || ""); }
    } catch (e) { setPlan(""); alert("Rivet hit a connection issue - try again."); }
    setPlanBusy(false);
  };

  const startFromPlan = () => { chargeCredits(15, "design");
    const qq = "The user APPROVED this plan. Produce the complete engineering design: 1) block architecture, 2) component selection with real part numbers and cheaper alternates, 3) power budget calculation, 4) PCB layout notes, 5) firmware bring-up outline, 6) end with a section '## CONNECTIONS' listing every wire on its own line as 'SOURCE -> DEST : LABEL' using short pin names, 7) then a section '## ASSEMBLY' listing physical attachments on its own line as 'PART -> HOST : METHOD' (standoffs, screws, gaskets, seals, brackets, mounting).\n\nAPPROVED PLAN:\n" + plan;
    ask(qq);
  };

  const generateReport = async () => {
    if (!answer || reportBusy) return;
    setReportBusy(true); setReport("");
    const prompt = "REPORT MODE. Convert the engineering answer below into an ASSEMBLER-FRIENDLY DESIGN SHEET that a self-employed technician can follow. Use EXACTLY these section headers, each on its own line starting with '## ': '## MATERIALS', '## TOOLS', '## STEPS', '## TEST', '## SAFETY'. Under MATERIALS list each item on its own line starting with '- ' and a category tag in square brackets: [POWER] for power parts, [IC] for chips, [PASSIVE] for resistors capacitors inductors, [PCB] for board items, [CONN] for connectors, [MECH] for mechanical parts; then part name, value and quantity. Under STEPS write numbered lines starting with 'STEP 1: ', 'STEP 2: ' etc, in simple language, one action per step. Keep everything short and practical. No extra commentary. If the original design contains wire lines 'SOURCE -> DEST : LABEL', keep them under a '## CONNECTIONS' section. If it contains physical attachment lines 'PART -> HOST : METHOD', keep them under a '## ASSEMBLY' section.\n\nORIGINAL DESIGN:\n" + answer;
    try {
      const r = await fetch("/api/rivet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt + "\n\n[CLIENT SELECTED CODE SYSTEM: " + CURRENT_CODE + "]", domain: domain }) });
      const j = await r.json();
      if (j.answer) { chargeCredits(5, "report"); setReport(j.answer); saveServer({ brief: q, design: answer, report: j.answer }); } else { setReport("Report generation failed - try again."); }
    } catch (e) { setReport("Report generation failed - try again."); }
    setReportBusy(false);
  };

  const reviewDesign = async () => {
    if (!answer || reviewBusy) return;
    chargeCredits(10, "review"); setReviewBusy(true); setReview("");
    const prompt = "REVIEW MODE. You are a second, independent senior engineer auditing the design below against the client brief and constraints. Be strict. Output exactly three sections with headers '## RED FLAGS', '## AMBER NOTES', '## GREEN CHECKS'. Under RED FLAGS write lines '- [RED] area: problem -> fix'. Under AMBER NOTES '- [AMBER] risk or tradeoff'. Under GREEN CHECKS '- [GREEN] item verified correct'. End with one line 'VERDICT: READY TO BUILD' or 'VERDICT: NEEDS REVISION'.\n\nDESIGN UNDER REVIEW:\n" + answer;
    try {
      const r = await fetch("/api/rivet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt + "\n\n[CLIENT SELECTED CODE SYSTEM: " + CURRENT_CODE + "]", domain: domain }) });
      const j = await r.json();
      setReview(j.answer || "Review failed - try again.");
    } catch (e) { setReview("Review failed - try again."); }
    setReviewBusy(false);
  };

  const generateVendors = async () => {
    if (!answer || vendorBusy) return;
    setVendorBusy(true); setVendor("");
    let PARTNER_DIR = ""; let CLIENT_REGION = "";
    try { const pr = await fetch("/api/partners"); const pj = await pr.json(); PARTNER_DIR = (pj.rows || []).map((r: any) => r.partner_name + " (" + [r.city, r.country].filter(Boolean).join(", ") + ") " + (r.services || "")).join(" | "); } catch (e) {}
    try { const gr = await fetch("/api/geo"); const gj = await gr.json(); CLIENT_REGION = [gj.city, gj.region, gj.country].filter(Boolean).join(", "); } catch (e) {}
    const prompt = "SOURCING AGENT MODE. Client location: " + (CLIENT_REGION || "unknown") + ". PRIORITY ORDER: 1) partners in the client country, 2) partners in the client continent, 3) China, 4) global best-price. Use this FounderPilot certified partner directory FIRST and name them exactly as listed: " + PARTNER_DIR + ". Then supplement with known market players. For the design below and production type '" + (qbProd || "unspecified") + "', produce a client-ready vendor shortlist with exactly these section headers: '## FAB VENDORS', '## ASSEMBLY VENDORS', '## PARTS VENDORS', '## CERTIFICATION VENDORS'. Under each, lines '- [VENDOR] Name - why suitable + what to ask them'. Mix global platforms (JLCPCB, PCBWay, Seeed Studio, OSH Park, MacroFab, LCSC, Digi-Key, Mouser) with a note to check FounderPilot Partners for local certified options. Match suggestions to the production type (prototype vs volume). End with one line 'NEXT: request quotes from at least 3 vendors and compare setup + unit cost.'.\n\nDESIGN:\n" + answer;
    try {
      const r = await fetch("/api/rivet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt + "\n\n[CLIENT SELECTED CODE SYSTEM: " + CURRENT_CODE + "]", domain: domain }) });
      const j = await r.json();
      setVendor(j.answer || "Vendor list failed - try again.");
    } catch (e) { setVendor("Vendor list failed - try again."); }
    setVendorBusy(false);
  };

  const requestRevision = () => {
    if (!revNote.trim()) { alert("Write the client objection first"); return; }
    const nextRev = rev + 1;
    const qq = "REVISION REQUEST (Rev " + String.fromCharCode(65 + nextRev) + "). Client objection: " + revNote + "\nProduce the fully revised engineering design. Start with a short '## CHANGES' section listing what changed, then the full design ending with '## CONNECTIONS' and '## ASSEMBLY'.\n\nCURRENT DESIGN:\n" + answer;
    setRev(nextRev); setRevNote(""); setShowRev(false); setReview("");
    ask(qq);
  };

  const teamPlan = async () => {
    if (!q.trim() || teamBusy) return;
    chargeCredits(10, "team"); setTeamBusy(true); setTeam("");
    const pctLine = "Use EXACTLY these contribution percentages: MAXI " + scoreSuites(q)[0] + "%, RIVET " + scoreSuites(q)[1] + "%, VOLT " + scoreSuites(q)[2] + "%, TERRA " + scoreSuites(q)[3] + "%.";
    const prompt = "COLLABORATION MODE. You are Rivet, the Electronics & Hardware engineer, coordinating WITH your equal peers: RIVET (Mechanical), VOLT (Electrical Power) and TERRA (Civil & Structural). The four suites collaborate as equals; no suite operates under another. For the client project below produce a cross-suite plan with EXACTLY these headers: '## MAXI — Electronics & Hardware', '## RIVET — Mechanical', '## VOLT — Electrical Power', '## TERRA — Civil & Structural', '## TIMELINE', '## HANDOFFS'. Under each suite header first line 'Contribution: XX%' then 3-6 bullets '- deliverable' that suite will design or produce. If not needed write 'Contribution: 0%' and '- Not required for this project'. " + pctLine + " Under TIMELINE write 'PHASE 1 Prototype: T+X weeks', 'PHASE 2 Validation (DVT): T+Y weeks', 'PHASE 3 Mass production ready: T+Z weeks'. Under HANDOFFS write lines 'FROM -> TO : what is exchanged'. End with 'Coordination: the four suites collaborate as equals and facilitate each other''s handoffs.'\n\nProject: " + q + "\nConstraints: Environment: " + (qbEnv || "unspecified") + " | Cost: " + (qbBudget || "unspecified") + " | Volume: " + (qbVolume || "unspecified") + " | Certs: " + (qbCerts || "unspecified") + " | Production type: " + (qbProd || "unspecified");
    try {
      const r = await fetch("/api/rivet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt + "\n\n[CLIENT SELECTED CODE SYSTEM: " + CURRENT_CODE + "]", domain: domain }) });
      const j = await r.json();
      setTeam(j.answer || "Team plan failed - try again.");
    } catch (e) { setTeam("Team plan failed - try again."); }
    setTeamBusy(false);
  };

  const teamShares = (() => {
    const colors: any = { MAXI: "#22d3ee", RIVET: "#94a3b8", VOLT: "#facc15", TERRA: "#4ade80" };
    const out: any[] = [];
    for (const k of ["MAXI", "RIVET", "VOLT", "TERRA"]) {
      const mm = team.match(new RegExp(k + "[^\\d]{0,60}?(\\d{1,3})\\s*%"));
      if (mm) out.push({ name: k, pct: parseInt(mm[1]), color: colors[k] });
    }
    return out;
  })();

  const downloadKicadPack = async () => {
    if (!answer) return;
    const zip = new JSZip();
    const rows = connRows(answer);
    const L: string[] = ["0", "SECTION", "2", "ENTITIES"];
    const push = (...a: string[]) => a.forEach((x) => L.push(x));
    const line = (x1: number, y1: number, x2: number, y2: number, layer: string) => { push("0", "LINE", "8", layer, "10", String(x1), "20", String(y1), "11", String(x2), "21", String(y2)); };
    const text = (x: number, y: number, h: number, s: string, layer: string) => { push("0", "TEXT", "8", layer, "10", String(x), "20", String(y), "40", String(h), "1", s.replace(/[\n\r]/g, " ")); };
    let dy = 0;
    text(0, dy, 5, "MAXI DESIGN - SCHEMATIC LAYOUT", "TITLE"); dy -= 12;
    for (const r of rows) {
      line(0, dy, 60, dy, "BOX"); line(60, dy, 60, dy - 8, "BOX"); line(60, dy - 8, 0, dy - 8, "BOX"); line(0, dy - 8, 0, dy, "BOX");
      line(140, dy, 200, dy, "BOX"); line(200, dy, 200, dy - 8, "BOX"); line(200, dy - 8, 140, dy - 8, "BOX"); line(140, dy - 8, 140, dy, "BOX");
      line(60, dy - 4, 140, dy - 4, "WIRE");
      text(2, dy - 6, 3, r.a, "TEXT"); text(142, dy - 6, 3, r.b, "TEXT"); text(80, dy - 2, 2.5, r.label, "TEXT");
      dy -= 16;
    }
    push("0", "ENDSEC", "0", "EOF");
    zip.file("rivet-wiring.dxf", L.join("\n"));
    const bomLines = ["Category,Description,Qty"];
    let inMat = false;
    for (const t of answer.split("\n").map((l) => l.trim())) {
      const h = t.replace(/^[\s\*]+/, "");
      if (h.indexOf("## ") === 0) { inMat = h.replace("## ", "").toUpperCase().indexOf("MATERIAL") === 0; continue; }
      if (inMat && t.indexOf("- ") === 0) { const tm = t.match(/\[([A-Z]+)\]/); bomLines.push('"' + (tm ? tm[1] : "PART") + '","' + t.substring(2).replace(/\[[A-Z]+\]\s*/, "").replace(/"/g, "'") + '",1'); }
    }
    zip.file("rivet-bom.csv", bomLines.join("\n"));
    zip.file("rivet-connections.csv", ["Source,Destination,Wire/Label"].concat(rows.map((r) => '"' + r.a + '","' + r.b + '","' + r.label + '"')).join("\n"));
    zip.file("README-FREECAD.txt", "RIVET -> FREECAD GUIDE\n====================\n\n1. Open FreeCAD -> File -> New Project\n2. PCB Editor: File -> Import -> DXF -> select rivet-wiring.dxf (import onto Eco1.User layer)\n3. Schematic Editor: place the parts from rivet-bom.csv and wire them per rivet-connections.csv\n4. When routed: File -> Plot -> Gerbers, then Fabrication Outputs -> Drill files\n5. Verify in FreeCAD built-in 3D viewer (or Autodesk Viewer (STEP/DWG)) before ordering\n\nGenerated by Rivet - FounderPilot Engineering Suite\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rivet-freecad-pack.zip"; a.click();
  };

  const packFor = async (tool: string) => {
    let src = ws(report || answer || team || "");
    if (!src) { alert("Run a design first (03), then download the pack."); return; }
    const zip = new JSZip();
    const rows = connRows(src);
    const L: string[] = ["0", "SECTION", "2", "ENTITIES"];
    const push = (...a: string[]) => a.forEach((x) => L.push(x));
    const line = (x1: number, y1: number, x2: number, y2: number, lay: string) => push("0", "LINE", "8", lay, "10", String(x1), "20", String(y1), "11", String(x2), "21", String(y2));
    const txt = (x: number, y: number, h: number, s: string) => push("0", "TEXT", "8", "TEXT", "10", String(x), "20", String(y), "40", String(h), "1", s.replace(/[\n\r]/g, " "));
    let yy = 0;
    txt(0, yy, 5, "MAXI DESIGN - SCHEMATIC LAYOUT"); yy -= 12;
    for (const r of rows) {
      line(0, yy, 60, yy, "BOX"); line(60, yy, 60, yy - 8, "BOX"); line(60, yy - 8, 0, yy - 8, "BOX"); line(0, yy - 8, 0, yy, "BOX");
      line(140, yy, 200, yy, "BOX"); line(200, yy, 200, yy - 8, "BOX"); line(200, yy - 8, 140, yy - 8, "BOX"); line(140, yy - 8, 140, yy, "BOX");
      line(60, yy - 4, 140, yy - 4, "WIRE");
      txt(2, yy - 6, 3, r.a); txt(142, yy - 6, 3, r.b); txt(80, yy - 2, 2.5, r.label);
      yy -= 16;
    }
    push("0", "ENDSEC", "0", "EOF");
    zip.file("rivet-wiring.dxf", L.join("\n"));
    zip.file("rivet-connections.csv", ["Source,Destination,Wire/Label"].concat(rows.map((r) => '"' + r.a + '","' + r.b + '","' + r.label + '"')).join("\n"));
    zip.file("README-" + tool.toUpperCase() + ".txt", "MAXI -> " + tool.toUpperCase() + " GUIDE\n====================\n\n1. Open " + tool + " and create a new project folder; copy these files into it.\n2. Import rivet-wiring.dxf as a reference layer (FreeCAD: PCB Editor -> File -> Import -> DXF; Onshape: PCB -> Import -> DXF).\n3. Place parts per your BOM and wire per rivet-connections.csv.\n4. When routed, export Gerbers + drill files.\n5. Verify in FreeCAD built-in 3D viewer or Autodesk Viewer (STEP/DWG) before ordering.\n\nGenerated by Rivet - FounderPilot Engineering Suite\n");
    const blob = await zip.generateAsync({ type: "blob" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rivet-" + tool.toLowerCase().replace(/\\s+/g, "").replace(/fusion360/i, "fusion360") + "-pack.zip"; a.click();
  };

  const downloadDiyPdf = () => downloadPdf(true);

  const downloadReport = () => {
    if (!report) return;
    const content = "RIVET DESIGN SHEET\nGenerated: " + new Date().toLocaleString() + "\nQuestion: " + q + "\n\n" + report + "\n\n---\nPowered by FounderPilot Engineering Suite\n";
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rivet-design-sheet.txt"; a.click();
  };

  const dxfEscape = (s: string) => s.replace(/[\n\r]/g, " ");
  const downloadDxf = () => {
    const rows = connRows(report || answer);
    const L: string[] = [];
    const push = (...a: string[]) => a.forEach((x) => L.push(x));
    push("0", "SECTION", "2", "ENTITIES");
    const line = (x1: number, y1: number, x2: number, y2: number, layer: string) => { push("0", "LINE", "8", layer, "10", String(x1), "20", String(y1), "11", String(x2), "21", String(y2)); };
    const text = (x: number, y: number, h: number, s: string, layer: string) => { push("0", "TEXT", "8", layer, "10", String(x), "20", String(y), "40", String(h), "1", dxfEscape(s)); };
    let y = 0;
    text(0, y, 5, "MAXI DESIGN - SCHEMATIC LAYOUT", "TITLE"); y -= 12;
    for (const r of rows) {
      line(0, y, 60, y, "BOX"); line(60, y, 60, y - 8, "BOX"); line(60, y - 8, 0, y - 8, "BOX"); line(0, y - 8, 0, y, "BOX");
      line(140, y, 200, y, "BOX"); line(200, y, 200, y - 8, "BOX"); line(200, y - 8, 140, y - 8, "BOX"); line(140, y - 8, 140, y, "BOX");
      line(60, y - 4, 140, y - 4, "WIRE");
      text(2, y - 6, 3, r.a, "TEXT"); text(142, y - 6, 3, r.b, "TEXT"); text(80, y - 2, 2.5, r.label, "TEXT");
      y -= 16;
    }
    push("0", "ENDSEC", "0", "EOF");
    const blob = new Blob([L.join("\n")], { type: "application/dxf" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rivet-wiring.dxf"; a.click();
  };

  const downloadBom = () => {
    const lines = (report || answer).split("\n").map((l) => l.trim());
    let inMat = false; const rows: string[] = ["Category,Description,Qty"];
    for (const t of lines) {
      const h = t.replace(/^[\s\*]+/, "");
      if (h.indexOf("## ") === 0) { inMat = h.replace("## ", "").toUpperCase().indexOf("MATERIAL") === 0; continue; }
      if (inMat && t.indexOf("- ") === 0) {
        const tagMatch = t.match(/\[([A-Z]+)\]/);
        const tag = tagMatch ? tagMatch[1] : "PART";
        let rest = t.substring(2).replace(/\[[A-Z]+\]\s*/, "");
        let qty = "1";
        const qm = rest.match(/(?:x|\bqty[:\s]*)\s*(\d+)/i);
        if (qm) { qty = qm[1]; }
        rest = rest.replace(/"/g, "'");
        rows.push('"' + tag + '","' + rest + '",' + qty);
      }
    }
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rivet-bom.csv"; a.click();
  };

  const downloadWires = () => {
    const rows = connRows(report || answer);
    const csv = ["Source,Destination,Wire/Label"].concat(rows.map((r) => '"' + r.a + '","' + r.b + '","' + r.label + '"'));
    const blob = new Blob([csv.join("\n")], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "rivet-connections.csv"; a.click();
  };

  const drawDiagramPdf = (page: any, rows: any[], title: string, M: number, maxW: number, yRef: { y: number }, ensure: (h: number) => void, bold: any, font: any) => {
    let y = yRef.y;
    ensure(40); y -= 8;
    page.drawRectangle({ x: M, y: y - 4, width: maxW, height: 18, color: rgb(0.9, 0.4, 0.9) });
    page.drawText(ws(title), { x: M + 6, y: y, size: 11, font: bold, color: rgb(0.08, 0.08, 0.08) });
    y -= 26;
    for (const r of rows) {
      ensure(30);
      const bw2 = 170;
      page.drawRectangle({ x: M, y: y - 4, width: bw2, height: 16, borderColor: rgb(0.2, 0.8, 0.9), borderWidth: 1 });
      page.drawText(ws(r.a), { x: M + 4, y: y, size: 8, font: font, color: rgb(0.1, 0.1, 0.1) });
      page.drawRectangle({ x: 595 - M - bw2, y: y - 4, width: bw2, height: 16, borderColor: rgb(0.2, 0.8, 0.5), borderWidth: 1 });
      page.drawText(ws(r.b), { x: 595 - M - bw2 + 4, y: y, size: 8, font: font, color: rgb(0.1, 0.1, 0.1) });
      page.drawLine({ start: { x: M + bw2, y: y + 4 }, end: { x: 595 - M - bw2, y: y + 4 }, thickness: 1, color: rgb(0.9, 0.4, 0.9) });
      page.drawText(ws(r.label), { x: 240, y: y + 8, size: 7, font: font, color: rgb(0.6, 0.3, 0.7) });
      y -= 24;
    }
    yRef.y = y;
  };

  const ws = (t: any) => String(t).replace(/[\u2018\u2019]/g, "\x27").replace(/[\u201C\u201D]/g, "\x22").replace(/\u2192/g, "->").replace(/[\u2013\u2014]/g, "-").replace(/\u00b5/g, "u").replace(/[\u03a9\u2126]/g, "Ohm").replace(/\u00d7/g, "x").replace(/\u00f7/g, "/").replace(/\u2264/g, "<=").replace(/\u2265/g, ">=").replace(/\u00b1/g, "+/-").replace(/\u00b0/g, " deg ").replace(/\u00b2/g, "2").replace(/\u00b3/g, "3").replace(/\u2248/g, "~").replace(/\u2026/g, "...").replace(/[^\x20-\x7E\n]/g, "");
const norm = (t: any) => ws(String(t)).replace(/\*\*/g, "").replace(/^#{0,6}\s*(?:\d+\)\s*)?(?:##\s*)?(CONNECTIONS|ASSEMBLY|MATERIALS|TOOLS|STEPS|TEST|SAFETY|STRESS|HANDOFFS)\s*$/mg, "## $1");
const downloadPdf = async (withDiy?: boolean) => {
    let src = ws(report || answer || team || "");
    if (!src) return;
    const doc = await PDFDocument.create();
    const bold = await doc.embedFont(StandardFonts.HelveticaBold);
    const font = await doc.embedFont(StandardFonts.Helvetica);
    let page = doc.addPage([595, 842]);
    let y = 800;
    const M = 50, maxW = 595 - M * 2;
    const newPage = () => { page = doc.addPage([595, 842]); y = 800; };
    const ensure = (h: number) => { if (y - h < 50) newPage(); };
    const COLORS: any = { MATERIALS: [0.95, 0.7, 0.2], TOOLS: [0.2, 0.8, 0.9], STEPS: [0.2, 0.8, 0.5], TEST: [0.3, 0.6, 1], SAFETY: [0.95, 0.35, 0.35], CONNECTIONS: [0.9, 0.4, 0.9], ASSEMBLY: [0.2, 0.8, 0.5], "RED FLAGS": [0.95, 0.2, 0.2], "AMBER NOTES": [0.95, 0.7, 0.2], "GREEN CHECKS": [0.2, 0.8, 0.5], CHANGES: [0.3, 0.6, 1] };
    const TAGS: any = { POWER: [0.95, 0.35, 0.35], IC: [0.7, 0.4, 0.9], PASSIVE: [0.3, 0.6, 1], PCB: [0.3, 0.8, 0.4], MECH: [0.5, 0.55, 0.6], CONN: [0.95, 0.8, 0.2], RED: [0.95, 0.2, 0.2], AMBER: [0.95, 0.7, 0.2], GREEN: [0.2, 0.8, 0.5] };
    page.drawText(ws("RIVET DESIGN SHEET"), { x: M, y: y, size: 18, font: bold, color: rgb(0.1, 0.1, 0.1) });
    y -= 16;
    page.drawText("Generated: " + new Date().toLocaleString() + "  |  Rev " + String.fromCharCode(65 + rev), { x: M, y: y, size: 9, font: font, color: rgb(0.4, 0.4, 0.4) });
    y -= 24;
    const wrap = (text: string, f: any, size: number): string[] => {
      const words = text.split(/\s+/); const out: string[] = []; let cur = "";
      for (const w of words) { const t = cur ? cur + " " + w : w; if (f.widthOfTextAtSize(t, size) > maxW && cur) { out.push(cur); cur = w; } else cur = t; }
      if (cur) out.push(cur);
      return out;
    };
    if (withDiy) {
      ensure(220); y -= 6;
      page.drawRectangle({ x: M, y: y - 4, width: maxW, height: 18, color: rgb(0.95, 0.7, 0.2) });
      page.drawText(ws("DIY WORKSHOP GUIDE"), { x: M + 6, y: y, size: 11, font: bold, color: rgb(0.08, 0.08, 0.08) });
      y -= 22;
      const diy = [
        "1. Print this sheet at 100% scale.",
        "2. Transfer the DXF outline onto your sheet stock (print + trace or scribe) and mark all hole centers.",
        "3. Cut the profile (jigsaw, hacksaw or CNC), drill the holes and deburr all edges.",
        "4. File edges, press in inserts, and fasten per the BOM below.",
        "5. Check fits and fastener torques before first use.",
        "Safety: wear gloves and eye protection; clamp work securely before cutting or drilling.",
        "Limitations: simple brackets & enclosures only. Complex weldments or castings: use FreeCAD/Onshape or Partner Build.",
        "",
        "================ DESIGN SHEET ================",
      ];
      for (const s of diy) {
        const lines = wrap(s, font, 10);
        for (const L of lines) { ensure(16); page.drawText(ws(L), { x: M, y: y, size: 10, font: font, color: rgb(0.15, 0.15, 0.15) }); y -= 14; }
      }
      y -= 8;
    }
    for (const line of src.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      const h = t.replace(/^[\s\*]+/, "");
      if (h.indexOf("## ") === 0) {
        const name = h.replace("## ", "").toUpperCase();
        const c = COLORS[name] || [0.4, 0.4, 0.4];
        ensure(34); y -= 10;
        page.drawRectangle({ x: M, y: y - 4, width: maxW, height: 18, color: rgb(c[0], c[1], c[2]) });
        page.drawText(ws(name), { x: M + 6, y: y, size: 11, font: bold, color: rgb(0.08, 0.08, 0.08) });
        y -= 22;
        continue;
      }
      if (t.indexOf("- ") === 0) {
        const tagMatch = t.match(/\[([A-Z]+)\]/);
        const tag = tagMatch ? tagMatch[1] : null;
        const rest = t.substring(2).replace(/\[[A-Z]+\]\s*/, "");
        const lines = wrap(rest, font, 10);
        ensure(16 * (lines.length + 1));
        let x = M + 6;
        if (tag) {
          const c = TAGS[tag] || [0.5, 0.5, 0.5];
          const tw = bold.widthOfTextAtSize(tag, 8) + 10;
          page.drawRectangle({ x: x, y: y - 3, width: tw, height: 12, color: rgb(c[0], c[1], c[2]) });
          page.drawText(ws(tag), { x: x + 5, y: y, size: 8, font: bold, color: rgb(1, 1, 1) });
          x += tw + 6;
        }
        for (const L of lines) { page.drawText(ws(L), { x: x, y: y, size: 10, font: font, color: rgb(0.15, 0.15, 0.15) }); y -= 13; x = M + 6; }
        y -= 3;
        continue;
      }
      if (/^STEP\s*\d/i.test(t)) {
        const stepNo = (t.match(/STEP\s*\d+/i) || ["STEP"])[0];
        const rest = t.replace(/STEP\s*\d+:\s*/i, "");
        const lines = wrap(rest, font, 10);
        ensure(16 * lines.length + 6);
        const bw = bold.widthOfTextAtSize(stepNo, 8) + 10;
        page.drawRectangle({ x: M + 6, y: y - 3, width: bw, height: 12, color: rgb(0.2, 0.8, 0.5) });
        page.drawText(ws(stepNo), { x: M + 11, y: y, size: 8, font: bold, color: rgb(0.08, 0.08, 0.08) });
        const x0 = M + 6 + bw + 6;
        for (let i2 = 0; i2 < lines.length; i2++) { page.drawText(ws(lines[i2]), { x: i2 === 0 ? x0 : M + 6, y: y, size: 10, font: font, color: rgb(0.15, 0.15, 0.15) }); y -= 13; }
        y -= 3;
        continue;
      }
      const lines = wrap(t, font, 10);
      ensure(15 * lines.length);
      for (const L of lines) { page.drawText(ws(L), { x: M + 6, y: y, size: 10, font: font, color: rgb(0.25, 0.25, 0.25) }); y -= 13; }
      y -= 2;
    }
    const yRef = { y: y };
    drawDiagramPdf(page, sectionRows(norm(src), "CONNECTIONS"), "SCHEMATIC - PIN TO PIN", M, maxW, yRef, ensure, bold, font);
    drawDiagramPdf(page, sectionRows(norm(src), "ASSEMBLY"), "ASSEMBLY - HOW PARTS ATTACH", M, maxW, yRef, ensure, bold, font);
    if (pid) page.drawText(ws("Project code: " + pid + "  - restore anytime at FounderPilot"), { x: M, y: 54, size: 8, font: font, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(ws("Powered by FounderPilot Engineering Suite"), { x: M, y: 40, size: 8, font: font, color: rgb(0.5, 0.5, 0.5) });
    const bytes = await doc.save();
    const blob = new Blob([bytes as any], { type: "application/pdf" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = withDiy ? "rivet-diy-print-pack.pdf" : "rivet-design-sheet.pdf"; a.click();
  };

  const qbInput = "w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm outline-none focus:border-purple-400";
  return (
    <main className="min-h-screen bg-slate-950 text-white p-8">
      <WalletBar />
      <div className="max-w-3xl mx-auto">
        <Link href="/suite/engineering" className="text-cyan-400 hover:underline text-sm">&larr; Back to Engineering Suite</Link>
        <h1 className="mt-4 text-3xl font-bold">🔧 Rivet — AI Mechanical Engineer</h1>
        <p className="mt-2 text-sm text-slate-400">Your Rivet-styled copilot for mechanisms, CAD, stress, materials, enclosures and DFM. Ask like you would a senior engineer.</p>
        <p className="mt-1 text-xs text-slate-500">Flow: 01 Brief → 02 Plan → 03 Design → 04 Sheet & PDF → 05 Build with partners.</p>

        <select value={domain} onChange={(e) => setDomain(e.target.value)} className="mt-6 w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm outline-none focus:border-cyan-400">
          {DOMAINS.map((d) => <option key={d}>{d}</option>)}
        </select>
        <label className="mt-4 block text-xs font-bold text-cyan-300"><div className="mb-6 p-4 bg-gradient-to-br from-cyan-500/10 to-emerald-500/10 border border-cyan-500/30 rounded-xl">
          <h3 className="text-lg font-bold mb-2">📸 Upload Product Photo (Optional)</h3>
          <p className="text-sm text-slate-400 mb-3">Upload a product image (JPG / PNG / WEBP). We identify the parts and start the design task automatically.</p>
          <p className="mt-2 text-[10px] text-slate-500">⚖️ Teardowns are AI estimates for guidance only - not final, not a quote, no warranty. Use at your own risk; verify with a Certified Partner before spending money. ⚠️ Starting a new project clears the current one — download your files (04/05) before starting a new project.</p>
          <input id="store-price-input" type="text" inputMode="numeric" placeholder="Store price seen (optional, e.g. 9999) - anchors cost realism" className="mt-3 w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200" />
          <input
            type="file"
            accept="image/*"
            className="block w-full text-sm text-slate-300 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-cyan-500 file:text-slate-950 hover:file:bg-cyan-400 cursor-pointer"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const reader = new FileReader();
              reader.onload = async () => {
                const base64 = await new Promise<string>((resolve) => { const im = new Image(); im.onload = () => { const max = 1024; const sc = Math.min(1, max / Math.max(im.width, im.height)); const cv = document.createElement("canvas"); cv.width = Math.round(im.width * sc); cv.height = Math.round(im.height * sc); const cx = cv.getContext("2d")!; cx.drawImage(im, 0, 0, cv.width, cv.height); resolve(cv.toDataURL("image/jpeg", 0.8)); }; im.onerror = () => resolve(reader.result as string); im.src = reader.result as string; });
                setAnswer("🔍 Analyzing product image...");
                try {
                  const res = await fetch("/api/teardown", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ image: base64, storePrice: (() => { const sp = (document.getElementById("store-price-input") as HTMLInputElement)?.value || ""; const ns = (sp.match(/\d[\d,]*/g) || []).map(x => parseInt(x.replace(/,/g, ""), 10)).filter(n => n > 0); return ns.length ? String(Math.round(ns.reduce((a, b) => a + b, 0) / ns.length)) : ""; })() })
                  });
                  const data = await res.json();
                  if (data.text) { try { let em = ""; try { for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i) || ""; if (k.startsWith("sb-") && k.endsWith("-auth-token")) { const j = JSON.parse(localStorage.getItem(k) || "null"); em = (j && j.user && j.user.email) || (j && j.currentSession && j.currentSession.user && j.currentSession.user.email) || ""; if (em) break; } } } catch (e) {} if (!em) { try { em = localStorage.getItem("fp_wallet_email") || ""; } catch (e) {} } if (em) { fetch("/api/credits", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: em, cost: 10, action: "teardown" }) }).then(r => r.json()).then(j => { const ib = imgBase(); clearAll(); if (ib) LASTIMG = ib; if (j && j.newBalance !== undefined) window.dispatchEvent(new CustomEvent("wallet-updated", { detail: { balance: j.newBalance } })); }).catch(() => {}); } } catch {} setPlan(""); setQ("TEARDOWN FROM UPLOADED PHOTO:\n" + (() => { const cs = [...data.text.matchAll(/-\s*\$([\d,]+)\s*-\s*(?:MAXI|RIVET|VOLT|TERRA)/g)].map(m => parseInt(m[1].replace(/,/g, ""), 10)); const s = cs.reduce((a, b) => a + b, 0); let t2 = data.text; if (s > 0) { t2 = t2.replace(/EST\. BOM @1k:[^\n]*/, "EST. BOM @1k: $" + s.toLocaleString()); } const sm = t2.match(/TEAM SPLIT:[^\n]*?MAXI (\d+)%[^\n]*?RIVET (\d+)%[^\n]*?VOLT (\d+)%[^\n]*?TERRA (\d+)%/); if (sm) { const a = +sm[1]; let b = +sm[2]; const c = +sm[3]; const d = +sm[4]; const tot = a + b + c + d; if (tot !== 100 && tot > 0) { b += 100 - tot; t2 = t2.replace(/TEAM SPLIT:[^\n]*/, "TEAM SPLIT: MAXI " + a + "% / RIVET " + b + "% / VOLT " + c + "% / TERRA " + d + "%"); } } const spv = (() => { const el = document.getElementById("store-price-input") as HTMLInputElement | null; const sp = el ? el.value : ""; const ns = (sp.match(/\d[\d,]*/g) || []).map(x => parseInt(x.replace(/,/g, ""), 10)).filter(n => n > 0); return ns.length ? Math.round(ns.reduce((x, y) => x + y, 0) / ns.length) : 0; })();return t2; })() + "\n\n⚠️ PRELIMINARY TEARDOWN - NOT A QUOTE. Parts, materials and costs are AI estimates for guidance only (typical accuracy +/-30%). Not final, not verified, no warranty of fitness or accuracy. Use at your own risk. For binding numbers, order a Certified Partner review."); setAnswer("✅ PARTS LIST ready - your 01 BRIEF is now filled with the teardown. Press Start Designing below."); }
                  else setAnswer("❌ Analysis failed: " + (data.error || "Unknown error"));
                } catch (err: any) {
                  setAnswer("❌ Upload failed: " + err.message);
                }
              };
              reader.readAsDataURL(file);
            }}
          />
        </div>
        01 · PROJECT BRIEF — the client&apos;s project / task</label>
        {snap && !q && !answer && (<div className="mb-3 rounded-xl border border-cyan-500/40 bg-cyan-500/10 p-3"><p className="text-xs font-bold text-cyan-200">Welcome back - project saved {new Date(snap.ts).toLocaleString()} on this device{snap.build ? " (build pack downloaded)" : ""}.</p><p className="mt-1 text-[11px] text-slate-400">Restore for WORD-FOR-WORD similarity with your downloaded pack. Starting fresh gives a similar but NOT identical design.</p><div className="mt-2 flex gap-2"><button onClick={() => { setQ(snap.q || ""); setAnswer(snap.answer || ""); setSnap(null); }} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-900">Restore last project</button><button onClick={() => { localStorage.removeItem("fp_snap_rivet"); setSnap(null); }} className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs font-bold text-slate-300">Start fresh</button></div></div>)}
        {!q && !answer && (<div className="mb-3 rounded-xl border border-white/10 bg-white/5 p-3"><p className="text-[11px] font-bold text-slate-300">🔄 Continuing from another device? Enter your 16-digit project code:</p><div className="mt-2 flex gap-2"><input value={codeInput} onChange={(e) => setCodeInput(e.target.value)} placeholder="e.g. 2609-0915-4821-0037" className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-sm" /><button onClick={() => restoreByCode(codeInput)} className="rounded-lg bg-cyan-500 px-4 py-2 text-xs font-bold text-slate-900">Restore</button></div>{projects.length > 0 && (<div className="mt-3"><p className="text-[11px] font-bold text-slate-300">📚 Your saved projects (this login):</p><div className="mt-1 flex flex-wrap gap-2">{projects.map((pr: any) => (<button key={pr.id} onClick={() => restoreByCode(pr.project_code)} className="rounded-full border border-cyan-500/40 px-3 py-1 text-[10px] font-bold text-cyan-200">{pr.project_code} · {(pr.brief || "").substring(0, 24)}</button>))}</div></div>)}</div>)}
        <textarea value={q} onChange={(e) => setQ(e.target.value)} rows={4} placeholder="Client project / task... e.g. Make me a temperature and humidity sensor node with WiFi and Bluetooth, powered by USB-C (5V), for consumer use." className="mt-2 w-full rounded-xl border border-white/10 bg-slate-900 p-4 text-sm outline-none focus:border-cyan-400" />
        <div className="mt-3 flex flex-wrap gap-2">
          {CHIPS.map((c) => <button key={c} onClick={() => { setQ(c); ask(c); }} className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs hover:bg-white/10">⚡ {c}</button>)}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
  <span className="text-xs font-bold text-cyan-300">🎯 Project complexity:</span>
  <select value={complexity} onChange={(e: any) => setComplexity(e.target.value)} className="rounded-full border border-fuchsia-500/40 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
    <option value="simple">Simple (brackets, PCBs, mechanisms) — quick asks allowed</option>
    <option value="complex">Complex (turbines, plants, aircraft) — full workflow required</option>
  </select>
</div>
          <p className="mt-1 text-[10px] text-slate-500">⚡ chips = quick ask (skips the plan). For the full 01→05 flow: write the brief + press Start Designing with Rivet.</p>

        <div className="mt-4 rounded-xl border-2 border-purple-500/40 bg-purple-500/5 p-4">
          <p className="text-sm font-bold text-purple-300">Project constraints — makes the design specific, not generic</p>
          <p className="mt-1 text-xs text-slate-400">Same pattern as Idea Validator & Business Model: brief + context = a tailored plan.</p>
          <div className="sticky top-2 z-40 mb-3 flex flex-wrap items-center gap-2 rounded-2xl border border-fuchsia-500/40 bg-slate-900/95 px-4 py-2 backdrop-blur"><span className="text-xs font-bold text-cyan-300">⚖️ Units / code system:</span><select value={codeSys} onChange={(e: any) => changeCodeSys(e.target.value)} className="rounded-full border border-fuchsia-500/40 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">{CODE_OPTIONS.map((o: any) => <option key={o.id} value={o.id} disabled={o.id === codeSys}>{o.label}{o.id === codeSys ? " ✓" : ""}</option>)}</select><span className="text-[10px] text-slate-500">1st change free, then 5 credits — existing output recalculates</span></div>
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
            <input value={qbEnv} onChange={(e) => setQbEnv(e.target.value)} placeholder="Environment & use (e.g. outdoor industrial, medical, consumer indoor)" className={qbInput} />
            <input value={qbBudget} onChange={(e) => setQbBudget(e.target.value)} placeholder="Target unit cost (e.g. under $10 per machined part)" className={qbInput} />
            <input value={qbVolume} onChange={(e) => setQbVolume(e.target.value)} placeholder="Production volume (e.g. prototype / 100 / 10,000)" className={qbInput} />
            <input value={qbCerts} onChange={(e) => setQbCerts(e.target.value)} placeholder="Certifications (e.g. ISO 2768, ASME Y14.5, CE Machinery, ISO 9001, none)" className={qbInput} />
          </div>
          <p className="mt-3 text-xs font-bold text-purple-300">What type of production do you need?</p>
          <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-2">
            {["Prototype", "Small batch", "Volume production", "Not sure yet"].map((p) => (
              <button key={p} onClick={() => setQbProd(p)} className={"rounded-lg border px-2 py-2 text-xs font-bold " + (qbProd === p ? "border-purple-400 bg-purple-500/30 text-white" : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10")}>{p}</button>
            ))}
          </div>
          <button onClick={makePlan} disabled={planBusy} className="mt-3 w-full rounded-xl bg-purple-600 px-4 py-3 font-bold text-white hover:bg-purple-500 disabled:opacity-60">{planBusy ? "Rivet is planning..." : "🚀 Start Designing with Rivet (mechanical only)"}</button>
        <p className="mt-1 text-[10px] text-slate-500">For drones, robots, power systems, buildings (projects needing mechanical + electrical + civil), use the 🤝 Team Plan button instead or after the plan appears.</p>
        </div>

        {plan && (
          <div className="mt-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4">
            <p className="text-sm font-bold text-emerald-300">💡 This looks like a multi-suite project (drones, robots, power systems, buildings need mechanical + electrical + civil too).</p>
            <button onClick={teamPlan} disabled={teamBusy} className="mt-2 w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-50">{teamBusy ? "Coordinating suites..." : "🤝 Get Team Plan — who does what + timeline to mass production"}</button>
          </div>
        )}

        {plan && (
          <div className="mt-4 rounded-xl border-2 border-fuchsia-500/50 bg-fuchsia-500/5 p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm font-bold text-fuchsia-300">02 · PLAN — ready for your approval</p>
              <div className="flex gap-2">
                <select value={codeSys} onChange={async (e: any) => { const v = e.target.value; if (v === codeSys) return; if (freeChangeUsed) { chargeCredits(5, "code-change"); } else { setFreeChangeUsed(true); } setCodeSys(v); CURRENT_CODE = v; if (plan || answer) { setPlanBusy(true); setBusy(true); try { const prompt = plan ? "RECALCULATE IN NEW CODE SYSTEM. Keep the same client intent. Output: #Goal, #Implementation plan." : "RECALCULATE IN NEW CODE SYSTEM. Keep the same client intent. Produce full engineering design with ## CONNECTIONS and ## ASSEMBLY sections."; const r = await fetch("/api/rivet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ question: prompt + "\n\nORIGINAL:\n" + (plan || answer) + "\n\n[NEW CODE SYSTEM: " + v + "] Recalculate all values in this code/unit system.", domain: domain }) }); const j = await r.json(); const t = j.answer || ""; if (plan) setPlan(t); else setAnswer(t); } catch (err) { alert("Recalculation failed: " + (err as any).message); } setPlanBusy(false); setBusy(false); } }} title="Code system / units — 1 free change, then 5 credits" className="rounded-full border border-fuchsia-500/40 bg-slate-900 px-3 py-1.5 text-xs font-bold text-white">
                  {CODE_OPTIONS.map((o: any) => <option key={o.id} value={o.id} disabled={o.id === codeSys}>{o.label}{o.id === codeSys ? " ✓" : ""}</option>)}
                </select>
                <button onClick={startFromPlan} disabled={plan.indexOf("#") < 0} className="rounded-full bg-fuchsia-600 px-5 py-2 text-sm font-bold text-white hover:bg-fuchsia-500 disabled:opacity-40">▶ Approve → 03 DESIGN</button>
                <button onClick={teamPlan} disabled={teamBusy} className="rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-40">{teamBusy ? "Coordinating..." : "🤝 Team Plan"}</button>
                <button onClick={() => setPlan("")} className="rounded-full border border-fuchsia-500/40 px-4 py-1.5 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/10">Clear</button>
              </div>
            </div>
            <div className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{plan}</div>
            <p className="mt-2 text-[10px] text-slate-500">▶ Approve generates 03 DESIGN (required for FreeCAD / Onshape / DXF / PDF exports). 🤝 Team Plan gives the cross-suite collaboration card instead.</p>
          </div>
        )}

        {answer && (
          <div id="design-card" className="mt-6 rounded-xl border border-white/10 bg-white/5 p-6">
            {pid && (<p className="mt-1 text-[10px] font-bold text-cyan-300">🎫 Project code: {pid} — saved to your cloud history. Enter it on ANY device (with your login) to restore this exact design word-for-word.</p>)}
            <h3 className="text-lg font-bold text-cyan-300">03 · DESIGN — Rivet&apos;s Engineering Answer · Rev {String.fromCharCode(65 + rev)}</h3>
            <div className="mt-3 whitespace-pre-wrap text-sm text-slate-200">{answer}</div>
            <div className="mt-4 rounded-lg border border-red-500/40 bg-red-500/10 p-3">
              <p className="text-xs font-bold text-red-300">⚠️ DRAFT DESIGN — NOT FINAL PRODUCT</p>
              <p className="mt-1 text-[11px] text-slate-400">This is an AI-generated engineering proposal, not a tested or validated product. <strong>Use at your own risk.</strong> FounderPilot provides no warranty of fitness, safety, or compliance. Before manufacturing: (1) prototype & test, (2) run FEA & interference checks, (3) obtain compliance certification (CE Machinery / ISO 9001 / ASME), (4) have a licensed engineer review. For certified validation, hire a <Link href="/suite/maxi/partners" className="text-emerald-300 underline">Certified Partner</Link>.</p>
            </div>
            {sectionRows(answer, "CONNECTIONS").length > 0 && (
              <div className="mt-4 rounded-xl border-2 border-cyan-400/40 bg-slate-900/60 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-bold text-cyan-300">🖥️ GRAPHICAL CONSOLE — auto-opens with 03 DESIGN</p>
                  <div className="flex gap-1">
                    {["SCH", "LAY", "ASM", "BLK"].map((t) => (
                      <button key={t} onClick={() => setGtab(t)} className={"rounded px-2 py-1 text-[10px] font-bold " + (gtab === t ? "bg-cyan-500 text-slate-950" : "bg-white/10 text-slate-300 hover:bg-white/20")}>{t}</button>
                    ))}
                  </div>
                </div>
                {gtab === "SCH" && <SchematicSheet text={answer} />}
                {gtab === "LAY" && <PcbPreview text={answer} />}
                {gtab === "ASM" && <Wiring rows={sectionRows(answer, "ASSEMBLY")} />}
                {gtab === "BLK" && <BlockDiagram rows={blockRows(answer)} />}
                <button onClick={downloadKicadPack} className="mt-2 w-full rounded-lg border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-xs font-bold text-emerald-200 hover:bg-emerald-500/20">📦 Download FreeCAD-ready pack (DXF + CSVs + guide) → open in your FreeCAD</button>
              </div>
            )}
            {window.location.hash === "#admin" && <p className="mt-4 text-xs text-slate-500">🕐 Generated: {stamp}{provider ? " | ⚡ " + provider : ""}</p>}
            <button onClick={generateReport} disabled={reportBusy} className="mt-4 w-full rounded-xl bg-amber-500 px-4 py-3 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-40">{reportBusy ? "Building sheet..." : "📄 Generate Report (next step)"}</button>
            <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-2">
              <button onClick={reviewDesign} disabled={reviewBusy} className="rounded-xl border border-red-500/40 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-200 hover:bg-red-500/20 disabled:opacity-40">{reviewBusy ? "Auditing..." : "🔍 Run Design Review (red-flag check)"}</button>
              <button onClick={() => setShowRev(!showRev)} className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-2.5 text-sm font-bold text-blue-200 hover:bg-blue-500/20">✏️ Client objection? Request revision</button>
            </div>
            {showRev && (
              <div className="mt-3">
                <textarea value={revNote} onChange={(e) => setRevNote(e.target.value)} rows={2} placeholder="Client objection / change request... e.g. budget is $10 not $15, must support USB-C PD, needs IP67." className="w-full rounded-xl border border-white/10 bg-slate-900 p-3 text-sm outline-none focus:border-blue-400" />
                <button onClick={requestRevision} className="mt-2 w-full rounded-xl bg-blue-500 px-4 py-2.5 font-bold text-slate-950 hover:bg-blue-400">Submit revision → Rev {String.fromCharCode(66 + rev)}</button>
              </div>
            )}
          </div>
        )}

        <button onClick={() => ask(q)} disabled={busy} className="mt-3 w-full rounded-xl border border-cyan-500/40 bg-cyan-500/10 px-4 py-2 text-sm font-bold text-cyan-200 hover:bg-cyan-500/20 disabled:opacity-50">{busy ? "Rivet is thinking..." : "⚡ Quick ask (skip the plan)"}</button>
        <button onClick={teamPlan} disabled={teamBusy || !q.trim()} className="mt-2 w-full rounded-xl border border-emerald-500/40 bg-emerald-500/10 px-4 py-2 text-sm font-bold text-emerald-200 hover:bg-emerald-500/20 disabled:opacity-50">{teamBusy ? "Coordinating suites..." : "🤝 Team Plan — Rivet coordinates with Maxi / Volt / Terra"}</button>

        {team && (
          <div className="mt-6 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/5 p-6">
            <h3 className="text-lg font-bold text-emerald-300">🤝 CROSS-SUITE COLLABORATION PLAN</h3>
            {teamShares.length > 0 && (
              <>
                <div className="mt-3 flex h-4 w-full overflow-hidden rounded-full border border-white/10">
                  {teamShares.map((s) => <div key={s.name} style={{ width: s.pct + "%", background: s.color }} />)}
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-[10px] font-bold">
                  {teamShares.map((s) => <span key={s.name} style={{ color: s.color }}>{s.name} {s.pct}%</span>)}
                </div>
              </>
            )}
            <div className="mt-4"><ReportView text={team} /></div>
          </div>
        )}

        {review && (
          <div className="mt-6 rounded-xl border-2 border-red-400/40 bg-red-500/5 p-6">
            <h3 className="text-lg font-bold text-red-300">🔍 Independent Design Review</h3>
            <p className="mt-1 text-xs text-slate-400">A second engineer audits the design. RED = must fix before build. VERDICT line tells you if it is implementable.</p>
            <div className="mt-4"><ReportView text={review} /></div>
          </div>
        )}

        {report && (
          <div className="mt-6 rounded-xl border-2 border-amber-400/40 bg-amber-500/5 p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-amber-300">04 · 📋 Assembler Sheet & Exports</h3>
              <div className="flex flex-wrap items-center gap-2">
                <button onClick={() => downloadPdf().catch((e: any) => alert("PDF error: " + (e && e.message ? e.message : String(e))))} className="rounded-xl bg-amber-500 px-5 py-2.5 text-sm font-bold text-slate-950 hover:bg-amber-400">⬇ Download PDF (final deliverable)</button>
                <button onClick={downloadDxf} className="rounded-lg border border-cyan-500/40 bg-cyan-500/20 px-3 py-1.5 text-xs font-bold text-cyan-200 hover:bg-cyan-500/30">📐 DXF</button>
                <button onClick={downloadBom} className="rounded-lg border border-emerald-500/40 bg-emerald-500/20 px-3 py-1.5 text-xs font-bold text-emerald-200 hover:bg-emerald-500/30">🧾 BOM.csv</button>
                <button onClick={downloadWires} className="rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/20 px-3 py-1.5 text-xs font-bold text-fuchsia-200 hover:bg-fuchsia-500/30">🔌 Joints.csv</button>
                <button onClick={downloadReport} className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-slate-300 hover:bg-white/10">TXT</button>
              </div>
            </div>
            <p className="mt-1 text-xs text-slate-400">Color-coded materials + step-by-step build guide for techs & assemblers.</p>
            <p className="mt-1 text-[11px] text-slate-500">Contract requires native CAD/eCAD (DWG, FreeCAD, SolidWorks)? Export DXF + CSVs here, then hire a certified conversion partner: <Link href="/suite/maxi/partners" className="text-emerald-300 underline">Rivet Partners</Link>.</p>
            <div className="mt-4"><ReportView text={report} /></div>
            {sectionRows(report, "CONNECTIONS").length > 0 && (
              <div className="mt-4 rounded-lg border border-fuchsia-500/30 bg-fuchsia-500/5 p-3">
                <p className="text-xs font-bold text-fuchsia-300">🔌 SCHEMATIC SHEET — auto-layout (FreeCAD-style)</p>
                <SchematicSheet text={report} />
              </div>
            )}
            {sectionRows(report, "ASSEMBLY").length > 0 && (
              <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-3">
                <p className="text-xs font-bold text-emerald-300">🧩 ASSEMBLY DIAGRAM — how parts attach</p>
                <Wiring rows={sectionRows(report, "ASSEMBLY")} />
              </div>
            )}
          </div>
        )}

        <div className="mt-6 rounded-xl border-2 border-emerald-400/40 bg-emerald-500/5 p-6">
          <h3 className="text-lg font-bold text-emerald-300">05 · BUILD — choose your path</h3>
          <p className="mt-1 text-xs text-slate-400">Export the design into ANY CAD (5 packs below) - or pick a build path further down: Partner Build / Free Tool / DIY.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button onClick={() => packFor("FreeCAD")} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400">📦 Outputs → my FreeCAD</button>
            <button onClick={() => packFor("Fusion 360")} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400">📦 Outputs → my Fusion 360</button>
            <button onClick={() => packFor("Onshape")} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400">📦 Outputs → my Onshape</button>
            <button onClick={() => packFor("SolidWorks")} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400">📦 Outputs → my SolidWorks</button>
            <button onClick={() => packFor("Inventor")} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400">📦 Outputs → my Inventor</button>
              <button onClick={() => packFor("AutoCAD Mechanical")} className="rounded-lg bg-cyan-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-cyan-400">📦 Outputs → my AutoCAD Mechanical</button>
            <button onClick={() => downloadPdf(true).catch((e: any) => alert("PDF error: " + (e && e.message ? e.message : String(e))))} className="rounded-lg bg-amber-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-amber-400">🖨 DIY Print Pack (guide + full design sheet)</button>
              <p className="mt-1 w-full text-[10px] text-slate-400">📌 Note: Download PDF & DIY Print Pack unlock after 03 DESIGN / Generate Report appears.</p>
          </div>
          <p className="mt-1 text-[10px] text-slate-500">These save straight to your Downloads folder (incognito included) - then copy into your CAD project folder.</p>
          <div className="mt-2 rounded-lg border border-white/10 bg-white/5 p-2">
            <p className="text-[10px] font-bold text-slate-300">🧰 Client has their own CAD? We speak every format (DXF + STEP + CSV import everywhere; native project files via certified partners):</p>
            <div className="mt-1 flex flex-wrap gap-1">
              <a href="https://www.freecad.org/download/" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/30">FreeCAD — free download</a>
              <a href="https://onshape.com" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/30">Onshape — browser</a>
              <a href="https://pro.onshape.com" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/30">Fusion 360</a>
              <a href="https://blender.org/download/" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/30">Blender</a>
              <a href="https://www.autodesk.com/products/eagle/" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:bg-white/10">Inventor / Creo</a>
              <a href="https://www.solidworks.com" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:bg-white/10">SolidWorks</a>
              <a href="https://www.3ds.com/pcb" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-2 py-0.5 text-[10px] font-bold text-slate-300 hover:bg-white/10">CATIA</a>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
              <div className="text-2xl">🏭</div>
              <h4 className="mt-2 font-bold text-emerald-200">Partner Build</h4>
              <p className="mt-1 text-xs text-slate-400">Certified fabricators handle everything. Fastest path to finished hardware.</p>
              <Link href="/suite/maxi/partners" className="mt-3 inline-block rounded-lg bg-emerald-500 px-3 py-1.5 text-xs font-bold text-slate-950 hover:bg-emerald-400">Find a Partner</Link>
            </div>
            <div className="rounded-xl border border-cyan-500/30 bg-cyan-500/10 p-4">
              <div className="text-2xl">🆓</div>
              <h4 className="mt-2 font-bold text-cyan-200">Free Tool Import</h4>
              <p className="mt-1 text-xs text-slate-400">Export DXF + STEP + BOM.csv → import into free tools like FreeCAD or Onshape.</p>
              <div className="mt-3 flex flex-wrap gap-1">
                <a href="https://www.freecad.org" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/30">FreeCAD ↗</a>
                <a href="https://onshape.com" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/30">Onshape ↗</a>
                <a href="https://blender.org" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-200 hover:bg-cyan-500/30">Blender ↗</a>
              </div>
              <p className="mt-2 text-[10px] text-slate-500">Tip: the 🖥️ console in 03 has a 📦 FreeCAD-ready pack (DXF + STEP + CSVs + import guide) for one-click handoff.</p>
            </div>
            <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
              <div className="text-2xl">🧪</div>
              <h4 className="mt-2 font-bold text-amber-200">DIY Workshop Build</h4>
              <p className="mt-1 text-xs text-slate-400">Print the PDF drawing and cut/drill at home with basic tools. Simple brackets & enclosures only.</p>
              <button onClick={() => setShowDiy(!showDiy)} className="mt-3 rounded-lg border border-amber-500/40 bg-amber-500/20 px-3 py-1.5 text-xs font-bold text-amber-200 hover:bg-amber-500/30">{showDiy ? "Hide DIY Guide" : "DIY Guide"}</button>
              {showDiy && (
                <div className="mt-2">
                  <ol className="list-decimal pl-4 text-[11px] text-slate-300 space-y-1">
                    <li>Print the PDF sheet (04 card) at 100% scale.</li>
                    <li>Transfer the DXF outline onto your sheet stock (print + trace or scribe) and mark all hole centers.</li>
                    <li>Cut the profile (jigsaw, hacksaw or CNC), drill the holes and deburr all edges.</li>
                    <li>File edges, press in inserts, and fasten per Joints.csv using the ASSEMBLY torques.</li>
                    <li>Multimeter continuity check before first power-up.</li>
                  </ol>
                  <p className="mt-1 text-[10px] text-slate-500">Limitations: single-layer only, no DRC checks. Multi-layer or SMD-heavy → use Free Tool Import or Partner Build.</p>
                </div>
              )}
            </div>
          </div>
          <div className="mt-4 rounded-lg border border-white/10 bg-white/5 p-3">
            <p className="text-xs font-bold text-slate-300">🔎 Verify before production (free, once you have STEP/DXF from your CAD):</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <a href="https://www.jlcpcb.com/gerber-viewer" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-3 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/30">Autodesk Viewer (STEP/DWG)</a>
              <a href="https://www.pcbway.com/project/gerber-viewer.html" target="_blank" rel="noreferrer" className="rounded-full border border-cyan-500/40 bg-cyan-500/20 px-3 py-1 text-[11px] font-bold text-cyan-200 hover:bg-cyan-500/30">Xometry instant quote</a>
              <a href="https://www.freecad.org" target="_blank" rel="noreferrer" className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-bold text-slate-300 hover:bg-white/10">Onshape (built-in 3D viewer)</a>
            </div>
          </div>
          <button onClick={generateVendors} disabled={vendorBusy || !answer} className="mt-4 w-full rounded-xl bg-emerald-500 px-4 py-3 font-bold text-slate-950 hover:bg-emerald-400 disabled:opacity-40">{vendorBusy ? "Building vendor list..." : "🤝 Generate Vendor List (client-ready)"}</button>
          {vendor && (
            <div className="mt-4 rounded-lg border border-emerald-500/30 bg-emerald-500/5 p-4">
              <p className="text-sm font-bold text-emerald-300">🤝 Vendor Shortlist — {qbProd || "any production"}</p>
              <div className="mt-2"><ReportView text={vendor} /></div>
            </div>
          )}
          <p className="mt-4 text-[11px] text-slate-500">For complex designs (weldments, castings, high-load parts), Partner Build or Free Tool Import is recommended. Manual DIY is only practical for very simple parts.</p>
        </div>
      </div>
    </main>
  );
}
