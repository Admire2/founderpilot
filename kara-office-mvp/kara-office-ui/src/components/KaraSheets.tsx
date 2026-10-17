import { useState, useEffect, useRef, useMemo } from 'react';
import { evaluate } from 'mathjs';
import { Download, Bot, HelpCircle, TrendingUp, Activity } from 'lucide-react';
import { publishArtifact } from '../lib/intelligence';

const ROW_H = 24;
const colName = (i: number) => String.fromCharCode(65 + i);

function sanitizeFormula(raw: string) {
  let e = raw.substring(1);
  e = e.replace(/[\s\u00A0\u1680\u2000-\u200B\u202F\u205F\u3000\uFEFF]/g, '');
  e = e.replace(/：/g, ':').replace(/（/g, '(').replace(/）/g, ')').replace(/＊/g, '*').replace(/／/g, '/').replace(/÷/g, '/').replace(/×/g, '*');
  return '=' + e;
}

export default function KaraSheets() {
  const [data, setData] = useState<Record<string, { raw: string }>>({});
  const [rowCount, setRowCount] = useState(200);
  const [colCount, setColCount] = useState(15);
  const [activeCell, setActiveCell] = useState<string | null>('A1');
  const [editingCell, setEditingCell] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [barValue, setBarValue] = useState('');
  const [aiResult, setAiResult] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [quantMode, setQuantMode] = useState(false);
  const [tradeSuggestions, setTradeSuggestions] = useState('');
  const [seekTask, setSeekTask] = useState(() => localStorage.getItem('karaSheetTask') || '');
  const [seekResult, setSeekResult] = useState(() => localStorage.getItem('karaSheetReport') || '');
  const [seekThinking, setSeekThinking] = useState(false);
  const [country, setCountry] = useState(() => localStorage.getItem('karaSheetCountry') || '');
  const [viewStart, setViewStart] = useState(0);
  const [viewLen, setViewLen] = useState(80);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { localStorage.setItem('karaSheetTask', seekTask); }, [seekTask]);
  useEffect(() => { localStorage.setItem('karaSheetReport', seekResult); }, [seekResult]);
  useEffect(() => { localStorage.setItem('karaSheetCountry', country); }, [country]);
  useEffect(() => { setBarValue(activeCell ? data[activeCell]?.raw || '' : ''); }, [activeCell]);
  useEffect(() => {
    const calc = () => { const el = scrollRef.current; if (el) setViewLen(Math.ceil(el.clientHeight / ROW_H) + 20); };
    calc();
    window.addEventListener('resize', calc);
    return () => window.removeEventListener('resize', calc);
  }, []);

  const COUNTRIES = ['United States','United Kingdom','Nigeria','Ghana','Kenya','South Africa','Egypt','Morocco','India','Pakistan','Bangladesh','China','Japan','South Korea','Singapore','Malaysia','Indonesia','Philippines','Vietnam','Thailand','Australia','New Zealand','Canada','Mexico','Brazil','Argentina','Chile','Germany','France','Italy','Spain','Portugal','Netherlands','Belgium','Sweden','Norway','Denmark','Finland','Switzerland','Austria','Poland','Turkey','Saudi Arabia','United Arab Emirates','Qatar','Israel','Russia','Ukraine','Ireland','Other'];

  // ===== KARA FORMULA ENGINE v2 (with QUANT MODE financial functions) =====
  const computed = useMemo(() => {
    const cache: Record<string, any> = {};
    const visiting: Record<string, boolean> = {};

    const normCDF = (x: number): number => {
      const a1 = 0.254829592, a2 = -0.284496736, a3 = 1.421413741, a4 = -1.453152027, a5 = 1.061405429, p = 0.3275911;
      const sign = x < 0 ? -1 : 1;
      x = Math.abs(x) / Math.sqrt(2);
      const t = 1.0 / (1.0 + p * x);
      const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);
      return 0.5 * (1.0 + sign * y);
    };
    const normPDF = (x: number): number => Math.exp(-0.5 * x * x) / Math.sqrt(2 * Math.PI);

    const bsCall = (S: number, K: number, T: number, r: number, sigma: number): number => {
      if (T <= 0 || sigma <= 0) return Math.max(0, S - K);
      const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
      const d2 = d1 - sigma * Math.sqrt(T);
      return S * normCDF(d1) - K * Math.exp(-r * T) * normCDF(d2);
    };
    const bsPut = (S: number, K: number, T: number, r: number, sigma: number): number => {
      if (T <= 0 || sigma <= 0) return Math.max(0, K - S);
      const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
      const d2 = d1 - sigma * Math.sqrt(T);
      return K * Math.exp(-r * T) * normCDF(-d2) - S * normCDF(-d1);
    };

    const greekDelta = (S: number, K: number, T: number, r: number, sigma: number, type: string): number => {
      if (T <= 0 || sigma <= 0) return type === 'call' ? (S > K ? 1 : 0) : (S < K ? -1 : 0);
      const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
      return type === 'call' ? normCDF(d1) : normCDF(d1) - 1;
    };
    const greekGamma = (S: number, K: number, T: number, r: number, sigma: number): number => {
      if (T <= 0 || sigma <= 0) return 0;
      const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
      return normPDF(d1) / (S * sigma * Math.sqrt(T));
    };
    const greekTheta = (S: number, K: number, T: number, r: number, sigma: number, type: string): number => {
      if (T <= 0 || sigma <= 0) return 0;
      const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
      const d2 = d1 - sigma * Math.sqrt(T);
      const term1 = -(S * normPDF(d1) * sigma) / (2 * Math.sqrt(T));
      return type === 'call' ? term1 - r * K * Math.exp(-r * T) * normCDF(d2) : term1 + r * K * Math.exp(-r * T) * normCDF(-d2);
    };
    const greekVega = (S: number, K: number, T: number, r: number, sigma: number): number => {
      if (T <= 0 || sigma <= 0) return 0;
      const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
      return S * normPDF(d1) * Math.sqrt(T);
    };
    const greekRho = (S: number, K: number, T: number, r: number, sigma: number, type: string): number => {
      if (T <= 0 || sigma <= 0) return 0;
      const d1 = (Math.log(S / K) + (r + 0.5 * sigma * sigma) * T) / (sigma * Math.sqrt(T));
      const d2 = d1 - sigma * Math.sqrt(T);
      return type === 'call' ? K * T * Math.exp(-r * T) * normCDF(d2) : -K * T * Math.exp(-r * T) * normCDF(-d2);
    };

    const rsi = (prices: number[], period: number = 14): number => {
      if (prices.length < period + 1) return 0;
      let gains = 0, losses = 0;
      for (let i = 1; i <= period; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff > 0) gains += diff; else losses += Math.abs(diff);
      }
      for (let i = period + 1; i < prices.length; i++) {
        const diff = prices[i] - prices[i - 1];
        if (diff > 0) { gains = (gains * (period - 1) + diff) / period; losses = (losses * (period - 1)) / period; }
        else { gains = (gains * (period - 1)) / period; losses = (losses * (period - 1) + Math.abs(diff)) / period; }
      }
      if (losses === 0) return 100;
      const rs = gains / losses;
      return 100 - (100 / (1 + rs));
    };

    const macd = (prices: number[]): { macd: number, signal: number, histogram: number } => {
      const ema = (data: number[], period: number): number[] => {
        const k = 2 / (period + 1);
        const result = [data[0]];
        for (let i = 1; i < data.length; i++) result.push(data[i] * k + result[i - 1] * (1 - k));
        return result;
      };
      if (prices.length < 26) return { macd: 0, signal: 0, histogram: 0 };
      const ema12 = ema(prices, 12);
      const ema26 = ema(prices, 26);
      const macdLine = ema12.map((v, i) => v - ema26[i]);
      const signalLine = ema(macdLine, 9);
      return { macd: macdLine[macdLine.length - 1], signal: signalLine[signalLine.length - 1], histogram: macdLine[macdLine.length - 1] - signalLine[signalLine.length - 1] };
    };

    const sharpeRatio = (returns: number[], riskFree: number = 0): number => {
      if (returns.length < 2) return 0;
      const mean = returns.reduce((a, b) => a + b, 0) / returns.length;
      const variance = returns.reduce((sum, r) => sum + Math.pow(r - mean, 2), 0) / returns.length;
      const stdev = Math.sqrt(variance);
      return stdev === 0 ? 0 : (mean - riskFree) / stdev;
    };

    const baseScope: any = {
      kif: (c: any, a: any, b: any) => (c ? a : b),
      kand: (...a: any[]) => a.every(Boolean),
      kor: (...a: any[]) => a.some(Boolean),
      vlookup: (key: any, g: any, idx: any) => {
        const rows: any[][] = Array.isArray(g) ? g : [g];
        for (const r of rows) { if (String(r[0]).toLowerCase() === String(key).toLowerCase()) return r[(idx as number) - 1] !== undefined ? r[(idx as number) - 1] : ''; }
        return '#N/A';
      },
      concatenate: (...a: any[]) => a.map(x => (Array.isArray(x) ? (x as any[]).flat(Infinity).join('') : String(x))).join(''),
      today: () => new Date().toLocaleDateString(),
    };

    const critFn = (crit: any) => {
      const s = String(crit);
      const m = s.match(/^(>=|<=|<>|>|<|=)(.*)$/);
      if (!m) return (v: any) => (typeof v === 'number' && !isNaN(parseFloat(s)) ? v === parseFloat(s) : String(v).toLowerCase() === s.toLowerCase());
      const op = m[1]; const raw = m[2]; const num = parseFloat(raw); const isNum = !isNaN(num);
      return (v: any) => {
        const lv: any = typeof v === 'number' ? v : String(v).toLowerCase();
        const rv: any = isNum ? num : raw.toLowerCase();
        switch (op) { case '>': return lv > rv; case '<': return lv < rv; case '>=': return lv >= rv; case '<=': return lv <= rv; case '=': return lv === rv; case '<>': return lv !== rv; }
        return false;
      };
    };
    const flat = (g: any) => (Array.isArray(g) ? (g as any[]).flat(Infinity) : [g]);
    const numsOf = (g: any) => flat(g).filter(v => typeof v === 'number');
    const aggScope: any = {
      ksum: (g: any) => numsOf(g).reduce((a: number, b: number) => a + b, 0),
      kaverage: (g: any) => { const n = numsOf(g); return n.length ? n.reduce((a: number, b: number) => a + b, 0) / n.length : 0; },
      kmin: (g: any) => { const n = numsOf(g); return n.length ? Math.min(...n) : 0; },
      kmax: (g: any) => { const n = numsOf(g); return n.length ? Math.max(...n) : 0; },
      kcount: (g: any) => numsOf(g).length,
      kcounta: (g: any) => flat(g).filter(v => v !== '' && v !== null && v !== undefined).length,
      kproduct: (g: any) => numsOf(g).reduce((a: number, b: number) => a * b, 1),
      kstdev: (g: any) => { const n = numsOf(g); if (n.length < 2) return 0; const mean = n.reduce((a, b) => a + b, 0) / n.length; const variance = n.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / n.length; return Math.sqrt(variance); },
      sumif: (g: any, crit: any, g2?: any) => {
        const rf = flat(g); const sf = g2 ? flat(g2) : rf; const f = critFn(crit); let s = 0;
        rf.forEach((v: any, i: number) => { if (f(v) && typeof sf[i] === 'number') s += sf[i]; });
        return s;
      },
      countif: (g: any, crit: any) => flat(g).filter(critFn(crit)).length,
      averageif: (g: any, crit: any, g2?: any) => {
        const rf = flat(g); const sf = g2 ? flat(g2) : rf; const f = critFn(crit); let s = 0, n = 0;
        rf.forEach((v: any, i: number) => { if (f(v) && typeof sf[i] === 'number') { s += sf[i]; n++; } });
        return n ? s / n : 0;
      },
      rsi: (g: any, period?: any) => rsi(numsOf(g), period || 14),
      sharpe: (g: any, rf?: any) => sharpeRatio(numsOf(g), rf || 0),
    };

    const quantScope: any = {
      bscall: (S: number, K: number, T: number, r: number, sigma: number) => bsCall(S, K, T, r, sigma),
      bsput: (S: number, K: number, T: number, r: number, sigma: number) => bsPut(S, K, T, r, sigma),
      delta: (S: number, K: number, T: number, r: number, sigma: number, type: string) => greekDelta(S, K, T, r, sigma, type),
      gamma: (S: number, K: number, T: number, r: number, sigma: number) => greekGamma(S, K, T, r, sigma),
      theta: (S: number, K: number, T: number, r: number, sigma: number, type: string) => greekTheta(S, K, T, r, sigma, type),
      vega: (S: number, K: number, T: number, r: number, sigma: number) => greekVega(S, K, T, r, sigma),
      rho: (S: number, K: number, T: number, r: number, sigma: number, type: string) => greekRho(S, K, T, r, sigma, type),
    };

    const get = (id: string): any => {
      if (cache[id] !== undefined) return cache[id];
      const cell = data[id];
      if (!cell || cell.raw === '') { cache[id] = 0; return 0; }
      if (!cell.raw.startsWith('=')) { const n = parseFloat(cell.raw); cache[id] = isNaN(n) ? cell.raw : n; return cache[id]; }
      if (visiting[id]) { cache[id] = '#CYCLE'; return '#CYCLE'; }
      visiting[id] = true;
      let cyclic = false;
      let expr = sanitizeFormula(cell.raw).substring(1);
      const grids: any[][][] = [];
      expr = expr.replace(/([A-Z]+)(\d+):([A-Z]+)(\d+)/g, (m2, c1, r1, c2, r2) => {
        const g: any[][] = [];
        for (let r = parseInt(r1); r <= parseInt(r2); r++) {
          const row: any[] = [];
          for (let c = c1.charCodeAt(0); c <= c2.charCodeAt(0); c++) row.push(get(String.fromCharCode(c) + r));
          g.push(row);
        }
        grids.push(g);
        return 'zzr' + grids.length;
      });
      expr = expr.replace(/([A-Z]+)(\d+)/g, (m2) => {
        const v = get(m2);
        if (v === '#CYCLE') { cyclic = true; return '0'; }
        return typeof v === 'number' ? String(v) : JSON.stringify(String(v));
      });
      expr = expr.replace(/\b(SUM|AVERAGE|MIN|MAX|COUNTA|COUNT|PRODUCT|STDEV)\s*\(/g, (m2, fn) => 'k' + fn.toLowerCase() + '(');
      expr = expr.replace(/\bIF\s*\(/g, 'kif(').replace(/\bAND\s*\(/g, 'kand(').replace(/\bOR\s*\(/g, 'kor(')
        .replace(/\bVLOOKUP\s*\(/g, 'vlookup(').replace(/\bSUMIF\s*\(/g, 'sumif(').replace(/\bCOUNTIF\s*\(/g, 'countif(')
        .replace(/\bAVERAGEIF\s*\(/g, 'averageif(').replace(/\bCONCATENATE\s*\(/g, 'concatenate(').replace(/\bTODAY\s*\(/g, 'today(')
        .replace(/\bRSI\s*\(/g, 'rsi(').replace(/\bSHARPE\s*\(/g, 'sharpe(');
      if (quantMode) {
        expr = expr.replace(/\bBSCALL\s*\(/g, 'bscall(').replace(/\bBSPUT\s*\(/g, 'bsput(')
          .replace(/\bDELTA\s*\(/g, 'delta(').replace(/\bGAMMA\s*\(/g, 'gamma(')
          .replace(/\bTHETA\s*\(/g, 'theta(').replace(/\bVEGA\s*\(/g, 'vega(').replace(/\bRHO\s*\(/g, 'rho(');
      }
      expr = expr.replace(/<>/g, '!=').replace(/([^<>=!])=(?!=)/g, '$1==');
      const sc: any = { ...baseScope, ...aggScope, ...(quantMode ? quantScope : {}) };
      grids.forEach((g, i) => { sc['zzr' + (i + 1)] = g; });
      let out: any;
      if (cyclic) out = '#CYCLE';
      else { try { out = evaluate(expr, sc); } catch (e) { out = '#ERROR'; } }
      delete visiting[id];
      cache[id] = out;
      return out;
    };

    const map: Record<string, any> = {};
    Object.keys(data).forEach(id => { map[id] = get(id); });
    return map;
  }, [data, quantMode]);

  const cellValue = (id: string): any => (computed[id] !== undefined ? computed[id] : '');

  const setCell = (id: string, raw: string) => setData(prev => ({ ...prev, [id]: { raw } }));
  const commitGrid = () => { if (editingCell) { setCell(editingCell, editValue); setEditingCell(null); } };
  const commitBar = () => { if (activeCell) setCell(activeCell, barValue); };

  const moveActive = (dir: 'down' | 'right') => {
    if (!activeCell) return;
    const col = activeCell.replace(/\d+/g, ''); const row = parseInt(activeCell.replace(/[A-Z]+/g, ''));
    if (dir === 'down' && row < rowCount) setActiveCell(col + (row + 1));
    if (dir === 'right') { const ci = col.charCodeAt(0) - 65; if (ci < colCount - 1) setActiveCell(colName(ci + 1) + row); }
  };

  const gridKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitGrid(); moveActive('down'); }
    else if (e.key === 'Tab') { e.preventDefault(); commitGrid(); moveActive('right'); }
    else if (e.key === 'Escape') setEditingCell(null);
  };
  const barKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); commitBar(); (e.target as HTMLElement).blur(); } };

  useEffect(() => {
    const hp = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return;
      if (editingCell !== null) return;
      if (activeCell && e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) { setEditingCell(activeCell); setEditValue(e.key); }
    };
    window.addEventListener('keydown', hp);
    return () => window.removeEventListener('keydown', hp);
  }, [activeCell, editingCell]);

  const sheetCSV = () => {
    const rows = [];
    for (let r = 1; r <= rowCount; r++) {
      const cells = []; let any = false;
      for (let c = 0; c < colCount; c++) {
        const v = cellValue(colName(c) + r);
        if (v !== undefined && v !== '') any = true;
        cells.push(v ?? '');
      }
      if (any) rows.push(cells.join(','));
    }
    return rows;
  };

  const exportCSV = () => {
    let csv = '';
    for (let r = 1; r <= rowCount; r++) {
      const row = [];
      for (let c = 0; c < colCount; c++) row.push('"' + String(cellValue(colName(c) + r) ?? '').replace(/"/g, '""') + '"');
      csv += row.join(',') + '\n';
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'KaraSheet.csv'; a.click();
  };

  const importCSV = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const lines = String(ev.target.result).split(/\r?\n/);
      const first = lines[0] || '';
      const delim = (first.split('\t').length > first.split(',').length) ? '\t' : ((first.split(';').length > first.split(',').length) ? ';' : ',');
      const next: Record<string, { raw: string }> = {};
      let maxRow = 0;
      lines.forEach((line, ri) => {
        if (!line.trim()) return;
        line.split(delim).forEach((cv, ci) => {
          if (ci >= 26) return;
          const val = cv.replace(/^"|"$/g, '').trim();
          if (val !== '') { next[colName(ci) + (ri + 1)] = { raw: val }; maxRow = Math.max(maxRow, ri + 1); }
        });
      });
      setData(next);
      if (maxRow + 50 > rowCount) setRowCount(maxRow + 50);
    };
    reader.readAsText(file); e.target.value = '';
  };

  const loadSampleData = () => {
    const raw: Record<string, string> = {
      A1: 'Product', B1: 'Unit Price', C1: 'Units Sold', D1: 'Revenue',
      A2: 'Kara Word Pro', B2: '25000', C2: '40', D2: '=B2*C2',
      A3: 'Kara Seek License', B3: '150000', C3: '12', D3: '=B3*C3',
      A4: 'Kara Sheets Biz', B4: '45000', C4: '25', D4: '=B4*C4',
      A5: 'Kara Notes Plus', B5: '6000', C5: '18', D5: '=B5*C5',
      A6: 'TOTAL', D6: '=SUM(D2:D5)',
      A7: 'Average Price', B7: '=AVERAGE(B2:B5)',
      A8: 'Best Revenue', D8: '=MAX(D2:D5)',
      A9: 'VAT/Sales Tax (set your rate)', D9: '=D6*0.075',
      A10: 'GROSS TOTAL', D10: '=D6+D9',
      E2: '=IF(B2>100000,"PREMIUM","STANDARD")',
      F2: '=VLOOKUP("Kara Word Pro",A2:D5,2,FALSE)',
    };
    const next: Record<string, { raw: string }> = {};
    Object.keys(raw).forEach(id => { next[id] = { raw: raw[id] }; });
    setData(next);
  };

  const loadQuantSample = () => {
    const raw: Record<string, string> = {};
    raw.A1 = 'Date'; raw.B1 = 'AAPL Close'; raw.C1 = 'Daily Return';
    const prices = [185.64, 184.25, 181.91, 181.18, 185.56, 185.14, 186.19, 185.59, 185.92, 183.63,
                    182.95, 184.37, 185.92, 186.06, 185.20, 183.45, 182.63, 182.29, 183.94, 184.37,
                    183.87, 185.04, 186.04, 185.14, 184.52, 186.97, 188.85, 189.71, 188.63, 187.96];
    for (let i = 0; i < prices.length; i++) {
      const row = i + 2;
      raw['A' + row] = '2024-01-' + String(i + 2).padStart(2, '0');
      raw['B' + row] = String(prices[i]);
      if (i > 0) raw['C' + row] = String(((prices[i] - prices[i-1]) / prices[i-1]).toFixed(4));
    }
    raw.A32 = 'Technical Indicators';
    raw.A33 = 'RSI(14)'; raw.B33 = '=RSI(B2:B31,14)';
    raw.A34 = 'MACD Line'; raw.B34 = '=MACD(B2:B31)';
    raw.A35 = 'Sharpe Ratio'; raw.B35 = '=SHARPE(C2:C31)';
    raw.A37 = 'Options Pricing (Black-Scholes)';
    raw.A38 = 'Underlying Price (S)'; raw.B38 = '100';
    raw.A39 = 'Strike Price (K)'; raw.B39 = '105';
    raw.A40 = 'Time to Expiry (T, years)'; raw.B40 = '0.25';
    raw.A41 = 'Risk-Free Rate (r)'; raw.B41 = '0.05';
    raw.A42 = 'Volatility (σ)'; raw.B42 = '0.20';
    raw.A44 = 'Call Option Price'; raw.B44 = '=BSCALL(B38,B39,B40,B41,B42)';
    raw.A45 = 'Put Option Price'; raw.B45 = '=BSPUT(B38,B39,B40,B41,B42)';
    raw.A47 = 'Greeks';
    raw.A48 = 'Delta (Call)'; raw.B48 = '=DELTA(B38,B39,B40,B41,B42,"call")';
    raw.A49 = 'Delta (Put)'; raw.B49 = '=DELTA(B38,B39,B40,B41,B42,"put")';
    raw.A50 = 'Gamma'; raw.B50 = '=GAMMA(B38,B39,B40,B41,B42)';
    raw.A51 = 'Theta (Call)'; raw.B51 = '=THETA(B38,B39,B40,B41,B42,"call")';
    raw.A52 = 'Vega'; raw.B52 = '=VEGA(B38,B39,B40,B41,B42)';
    const next: Record<string, { raw: string }> = {};
    Object.keys(raw).forEach(id => { next[id] = { raw: raw[id] }; });
    setData(next);
    setQuantMode(true);
  };

  const analyzeTrades = async () => {
    const rows = sheetCSV();
    if (!rows.length) { alert('Sheet is empty. Load Quant Sample Data or import OHLCV data first.'); return; }
    setAiThinking(true); setTradeSuggestions('');
    const userPrompt = seekTask.trim();
    const prompt = userPrompt ? `You are Kara Quant, a Wall Street quantitative analyst. User request: ${userPrompt}\n\nTrading data:\n${rows.join('\n')}\n\nProvide actionable analysis with specific numbers.` : `You are Kara Quant, a Wall Street quantitative analyst. Analyze this trading data:

DATA:
${rows.join('\n')}

Provide:
1. Technical signals (RSI interpretation: <30 oversold, >70 overbought; MACD trend direction; price action)
2. Options analysis (interpret Black-Scholes prices correctly: call vs put are DIFFERENT instruments, not fair value comparisons; Greeks meaning: Delta = directional sensitivity, Gamma = acceleration, Theta = time decay, Vega = volatility sensitivity)
3. Risk metrics (Sharpe ratio calculation, volatility assessment)
4. Specific trade recommendations with confidence scores
5. Portfolio optimization

CRITICAL: For options, Call Price and Put Price are separate valuations - do NOT compare them as "fair value vs market". Each is the theoretical price of that specific contract.

Be precise with numbers. Reference actual cell values.`;
    try {
      console.log('[KaraSheets] Trade Analyzer calling AI with', rows.length, 'rows');
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const d = await res.json();
      console.log('[KaraSheets] Trade Analyzer response:', d);
      setTradeSuggestions((d.response || 'No analysis returned.').trim());
    } catch (e) { console.error('[KaraSheets] Trade Analyzer error:', e); setTradeSuggestions('Kara Local engine offline. Start Ollama.'); }
    setAiThinking(false);
  };

  const analyzeSheet = async () => {
    const rows = sheetCSV();
    if (!rows.length) { alert('Sheet is empty.'); return; }
    setAiThinking(true); setAiResult(' ');
    try {
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: 'You are Kara Seek. Analyze this spreadsheet data: state totals, patterns, and give one business recommendation.\n\nCSV:\n' + rows.join('\n'), stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const d = await res.json();
      setAiResult((d.response || 'No analysis.').trim());
    } catch (e) { setAiResult('Engine offline.'); }
    setAiThinking(false);
  };

  const mk = country.trim() || '(country)';
  const seekChips = [
    'Verify my Unit Price column against 2026 market rates in __COUNTRY__',
    "Convert my TOTAL revenue to US Dollars at today's exchange rate",
    'Check the current VAT/sales tax rate in __COUNTRY__ and confirm my tax row',
    'Draft a 3-sentence sales summary from this sheet for my investors',
    'Summarize ONLY what my sheet data shows (no web search)',
  ];
  
  const quantChips = [
    'Analyze RSI and MACD for entry/exit signals',
    'Calculate option Greeks and suggest hedging strategy',
    'Compare implied vs historical volatility from price data',
    'Identify support/resistance levels from OHLCV data',
    'Calculate Sharpe ratio and suggest portfolio allocation',
    'Analyze price trend and suggest BUY/SELL/HOLD with confidence scores',
    'Evaluate Black-Scholes pricing and recommend options strategy',
  ];
  
  const displayTask = seekTask.split('__COUNTRY__').join(mk);

  const runSeek = async () => {
    if (!seekTask.trim()) { alert('Type a task for Kara Seek first.'); return; }
    if (!country.trim() && /__COUNTRY__|\(country\)/.test(seekTask)) { alert('Please choose your market/country first.'); return; }
    const rows = sheetCSV();
    if (!rows.length) { alert('Sheet is empty.'); return; }
    const finalTask = seekTask.split('__COUNTRY__').join(country.trim() || '(country)');
    setSeekThinking(true); setSeekResult('');
    try {
      const res = await fetch('http://localhost:3001/api/seek', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: 'CONTEXT - Kara Sheets data (CSV):\n' + rows.join('\n') + '\n\nTASK: ' + finalTask + '\nUse live web search only where external facts are explicitly needed.' }) });
      const d = await res.json();
      setSeekResult(d.success ? d.answer : 'Kara Seek failed');
    } catch (e) { setSeekResult('Engine offline'); }
    setSeekThinking(false);
  };

  const nums = Object.keys(computed).map(id => computed[id]).filter(v => typeof v === 'number');
  const sum = nums.reduce((a, b) => a + b, 0);

  const rowsSlice = [];
  for (let r = viewStart + 1; r <= Math.min(rowCount, viewStart + viewLen); r++) rowsSlice.push(r);

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex items-center gap-2 flex-shrink-0 flex-wrap relative">
        <button onClick={() => { publishArtifact('sheets', 'Kara Sheets data', sheetCSV().join('\n')); alert('Sheet published to Kara Intelligence.'); }} className="px-3 py-1.5 bg-slate-800 text-white text-xs rounded hover:bg-slate-700">Publish</button>
        <button onClick={analyzeSheet} className="flex items-center gap-1 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700"><Bot size={12}/> Kara AI: Analyze</button>
        <button onClick={() => setQuantMode(q => !q)} className={`flex items-center gap-1 px-3 py-1.5 text-xs rounded ${quantMode ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-700'}`}><Activity size={12}/> Quant Mode: {quantMode ? 'ON' : 'OFF'}</button>
        {quantMode && <button onClick={analyzeTrades} className="flex items-center gap-1 px-3 py-1.5 bg-orange-600 text-white text-xs rounded hover:bg-orange-700"><TrendingUp size={12}/> Trade Analyzer</button>}
        {quantMode && <button onClick={loadQuantSample} className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded hover:bg-amber-600">Load Quant Sample</button>}
        <button onClick={exportCSV} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700"><Download size={12}/> Export CSV</button>
        <button onClick={() => setShowHelp(h => !h)} className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300"><HelpCircle size={12}/> fx Help</button>
        <button onClick={() => setRowCount(n => n + 500)} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300">+ 500 Rows</button>
        <button onClick={() => setColCount(n => Math.min(26, n + 5))} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300">+ 5 Cols</button>
        <span className="text-[10px] text-slate-400 ml-auto">{rowCount} rows x {colCount} cols {quantMode ? '(QUANT MODE ACTIVE)' : ''}</span>
        {showHelp && (
          <div className="absolute top-full left-2 mt-1 z-50 bg-white border border-slate-300 shadow-2xl rounded-lg p-4 w-96 text-xs text-slate-700">
            <b className="text-slate-900">Kara Formula Engine v2 {quantMode ? '(QUANT MODE)' : ''}</b>
            <ul className="mt-2 space-y-1 list-disc pl-4">
              <li>Standard: SUM, AVERAGE, MIN, MAX, COUNT, IF, VLOOKUP, SUMIF, CONCATENATE</li>
              <li>Technical: RSI, MACD, Sharpe Ratio</li>
              {quantMode && <><li className="text-emerald-700 font-semibold">QUANT: BSCALL, BSPUT (Black-Scholes pricing)</li>
              <li className="text-emerald-700 font-semibold">GREEKS: DELTA, GAMMA, THETA, VEGA, RHO</li></>}
              <li>Every formula starts with = • Live recalc • #CYCLE guard</li>
            </ul>
          </div>
        )}
      </div>

      <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 flex items-center gap-2 flex-shrink-0 flex-wrap">
        <input value={displayTask} onChange={(e) => setSeekTask(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') runSeek(); }}
          className="flex-1 min-w-56 border border-slate-200 rounded px-2 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500"
          placeholder={quantMode ? "Ask Kara Quant: analyze trades, calculate Greeks, suggest strategies..." : "Give Kara Seek a mission on this sheet..."} />
        <button onClick={loadSampleData} className="px-3 py-1.5 bg-amber-500 text-white text-xs rounded hover:bg-amber-600">Load Business Sample</button>
        <button onClick={() => document.getElementById('kara-csv-input')?.click()} className="px-3 py-1.5 bg-slate-200 text-slate-700 text-xs rounded hover:bg-slate-300">Import CSV/TXT</button>
        <input id="kara-csv-input" type="file" hidden accept=".csv,.txt" onChange={importCSV} />
        <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-44 border border-slate-200 rounded px-2 py-1.5 text-xs bg-white">
          <option value="">— Choose country —</option>
          {COUNTRIES.map(cn => <option key={cn} value={cn}>{cn}</option>)}
        </select>
        <button onClick={runSeek} className="px-3 py-1.5 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700 flex items-center gap-1"><Bot size={12}/> Run Kara Seek</button>
        <div className="flex gap-1 flex-wrap w-full">
          {(quantMode ? quantChips : seekChips).map((ch, i) => (
            <button key={i} onClick={() => setSeekTask(ch)} className="px-2 py-1 bg-white border border-indigo-200 text-indigo-600 text-[10px] rounded hover:bg-indigo-50">{ch.split(' ').slice(0, 5).join(' ')}...</button>
          ))}
        </div>
      </div>

      {seekThinking && <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 text-xs text-indigo-700 flex-shrink-0">🌐 Kara Seek working...</div>}
      {seekResult && (
        <div className="bg-indigo-50 border-b border-indigo-200 px-4 py-2 text-xs text-indigo-900 whitespace-pre-wrap max-h-56 overflow-auto flex-shrink-0">
          <div className="flex justify-between items-center mb-1"><b>Kara Seek Report</b><button onClick={() => setSeekResult('')} className="text-indigo-400">✕</button></div>
          {seekResult}
        </div>
      )}
      {tradeSuggestions && (
        <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 text-xs text-orange-900 whitespace-pre-wrap max-h-72 overflow-auto flex-shrink-0">
          <div className="flex justify-between items-center mb-1"><b className="flex items-center gap-1"><TrendingUp size={12}/> Trade Analysis & Suggestions</b><button onClick={() => setTradeSuggestions('')} className="text-orange-400">✕</button></div>
          {aiThinking ? 'Analyzing trade data...' : tradeSuggestions}
        </div>
      )}
      {aiResult && (
        <div className="bg-purple-50 border-b border-purple-200 px-4 py-2 text-xs text-purple-900 whitespace-pre-wrap max-h-40 overflow-auto flex-shrink-0">
          <div className="flex justify-between items-center mb-1"><b>Sheet Analysis</b><button onClick={() => setAiResult('')} className="text-purple-400">✕</button></div>
          {aiResult}
        </div>
      )}

      <div className="flex items-center border-b border-slate-200 bg-white flex-shrink-0">
        <div className="w-20 h-8 flex items-center justify-center border-r border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">{activeCell || ''}</div>
        <div className="px-2 text-slate-400 italic text-sm border-r border-slate-200 h-full flex items-center">fx</div>
        <input className="flex-1 h-8 px-2 text-sm outline-none" value={barValue} onChange={(e) => setBarValue(e.target.value)} onKeyDown={barKeyDown} onBlur={commitBar} />
      </div>

      <div ref={scrollRef} onScroll={(e) => { const el = e.currentTarget; setViewStart(Math.max(0, Math.floor(el.scrollTop / ROW_H) - 10)); }} className="flex-1 overflow-auto bg-slate-100">
        <table className="border-collapse w-max bg-white">
          <thead className="sticky top-0 z-10">
            <tr>
              <th className="w-10 bg-slate-100 border border-slate-300 sticky left-0 z-20" style={{ height: ROW_H }}></th>
              {Array.from({ length: colCount }, (_, i) => <th key={i} className="w-24 bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-600" style={{ height: ROW_H }}>{colName(i)}</th>)}
            </tr>
          </thead>
          <tbody>
            {viewStart > 0 && <tr style={{ height: viewStart * ROW_H }}><td colSpan={colCount + 1} className="p-0 border-0" /></tr>}
            {rowsSlice.map(r => (
              <tr key={r}>
                <td className="w-10 bg-slate-100 border border-slate-300 text-xs font-semibold text-slate-600 text-center sticky left-0 z-10" style={{ height: ROW_H }}>{r}</td>
                {Array.from({ length: colCount }, (_, ci) => {
                  const cellId = colName(ci) + r;
                  const isActive = activeCell === cellId;
                  const isEditing = editingCell === cellId;
                  const v = cellValue(cellId);
                  return (
                    <td key={ci} className={`w-24 border border-slate-200 p-0 relative ${isActive ? 'outline outline-2 outline-blue-500 z-10' : ''}`} style={{ height: ROW_H }}
                      onClick={() => { setActiveCell(cellId); setEditingCell(null); }}
                      onDoubleClick={() => { setEditingCell(cellId); setEditValue(data[cellId]?.raw || ''); setTimeout(() => inputRef.current?.focus(), 0); }}>
                      {isEditing ? (
                        <input ref={inputRef} className="w-full h-full px-1 text-xs outline-none" value={editValue} onChange={(e) => setEditValue(e.target.value)} onKeyDown={gridKeyDown} onBlur={commitGrid} />
                      ) : (
                        <div className="w-full h-full px-1 text-xs flex items-center overflow-hidden text-ellipsis whitespace-nowrap">{typeof v === 'number' ? v : String(v ?? '')}</div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
            {viewStart + viewLen < rowCount && <tr style={{ height: (rowCount - (viewStart + viewLen)) * ROW_H }}><td colSpan={colCount + 1} className="p-0 border-0" /></tr>}
          </tbody>
        </table>
      </div>

      <div className="h-6 bg-slate-800 text-white text-[10px] flex items-center px-4 gap-6 flex-shrink-0">
        <span>Ready</span>
        <span className="ml-auto">Sum: {sum.toFixed(2)}</span>
        <span>Average: {nums.length ? (sum / nums.length).toFixed(2) : '0.00'}</span>
        <span>Count: {nums.length}</span>
        <span className="ml-4">Kara Sheets v2 {quantMode ? '(QUANT)' : ''}</span>
      </div>
    </div>
  );
}

