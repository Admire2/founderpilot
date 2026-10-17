import { useState, useRef } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PDFDocument } from 'pdf-lib';
import mammoth from 'mammoth';
import { marked } from 'marked';
import { Upload, FileText, Merge, Download, X } from 'lucide-react';

type PdfItem = { id: string; name: string; url: string; pages?: number };

export default function KaraPDF() {
  const [items, setItems] = useState<PdfItem[]>([]);
  const [status, setStatus] = useState('');
  const [mode, setMode] = useState<'convert' | 'merge'>('convert');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const mergeInputRef = useRef<HTMLInputElement>(null);

  const SUPPORTED = ['.txt','.md','.html','.csv','.json','.jpg','.jpeg','.png','.webp','.docx','.xlsx'];

  const toPdfFromText = async (name: string, text: string) => {
    const doc = new jsPDF();
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, 10);
    return doc.output('blob');
  };

  const toPdfFromMarkdown = async (name: string, md: string) => {
    const html = marked(md) as string;
    const doc = new jsPDF();
    const div = document.createElement('div');
    div.innerHTML = html;
    const text = div.innerText;
    const lines = doc.splitTextToSize(text, 180);
    doc.text(lines, 10, 10);
    return doc.output('blob');
  };

  const toPdfFromHtml = async (name: string, html: string) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 20;
    const maxWidth = pageWidth - 2 * margin;
    let y = margin;
    const lineHeight = 6;
    const checkPage = () => { if (y > 275) { doc.addPage(); y = margin; } };

    const renderNode = (node: Node, bold = false, italic = false, fontSize = 11, isHeading = false) => {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || '';
        if (!text.trim()) return;
        doc.setFont('helvetica', bold ? 'bold' : (italic ? 'italic' : 'normal'));
        doc.setFontSize(fontSize);
        const lines = doc.splitTextToSize(text, maxWidth);
        checkPage();
        doc.text(lines, margin, y);
        y += lines.length * lineHeight + (isHeading ? 4 : 1);
        return;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      const el = node as HTMLElement;
      const tag = el.tagName.toLowerCase();
      let newBold = bold, newItalic = italic, newSize = fontSize, newHeading = isHeading;
      if (['b', 'strong'].includes(tag)) newBold = true;
      if (['i', 'em'].includes(tag)) newItalic = true;
      if (tag === 'h1') { newSize = 18; newHeading = true; newBold = true; }
      else if (tag === 'h2') { newSize = 15; newHeading = true; newBold = true; }
      else if (tag === 'h3') { newSize = 13; newHeading = true; newBold = true; }
      else if (tag === 'h4') { newSize = 12; newHeading = true; newBold = true; }
      else if (tag === 'p') { y += 4; checkPage(); }
      else if (tag === 'br') { y += lineHeight; checkPage(); return; }
      else if (tag === 'ul' || tag === 'ol') { y += 2; }
      else if (tag === 'li') { y += 2; checkPage(); doc.text('•', margin, y); y += lineHeight; }

      el.childNodes.forEach(child => renderNode(child, newBold, newItalic, newSize, newHeading));
    };

    const div = document.createElement('div');
    div.innerHTML = html;
    div.childNodes.forEach(node => renderNode(node));
    return doc.output('blob');
  };

  const toPdfFromCsv = async (name: string, csv: string) => {
    const rows = csv.split(/\r?\n/).map(l => l.split(',').map(c => c.replace(/^"|"$/g, '')));
    const doc = new jsPDF();
    autoTable(doc, { head: [rows[0]], body: rows.slice(1), startY: 10 });
    return doc.output('blob');
  };

  const toPdfFromImage = async (name: string, dataUrl: string) => {
    const doc = new jsPDF();
    const img = new Image();
    img.src = dataUrl;
    await new Promise(r => img.onload = r);
    const ratio = Math.min(190 / img.width, 270 / img.height);
    doc.addImage(dataUrl, 'JPEG', 10, 10, img.width * ratio, img.height * ratio);
    return doc.output('blob');
  };

  const toPdfFromDocx = async (name: string, arrayBuffer: ArrayBuffer) => {
    const result = await mammoth.convertToHtml({ arrayBuffer });
    return toPdfFromHtml(name, result.value);
  };

  const convertFile = async (file: File) => {
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!SUPPORTED.includes(ext)) {
      setStatus(`❌ ${file.name}: unsupported format (${ext}). Supported: ${SUPPORTED.join(', ')}`);
      return;
    }
    setStatus(`⏳ Converting ${file.name}...`);
    try {
      let blob: Blob;
      if (ext === '.txt' || ext === '.json') {
        blob = await toPdfFromText(file.name, await file.text());
      } else if (ext === '.md') {
        blob = await toPdfFromMarkdown(file.name, await file.text());
      } else if (ext === '.html') {
        blob = await toPdfFromHtml(file.name, await file.text());
      } else if (ext === '.csv') {
        blob = await toPdfFromCsv(file.name, await file.text());
      } else if (['.jpg','.jpeg','.png','.webp'].includes(ext)) {
        blob = await toPdfFromImage(file.name, URL.createObjectURL(file));
      } else if (ext === '.docx') {
        blob = await toPdfFromDocx(file.name, await file.arrayBuffer());
      } else {
        blob = await toPdfFromText(file.name, await file.text());
      }
      const url = URL.createObjectURL(blob);
      setItems(prev => [...prev, { id: Date.now().toString(36), name: file.name.replace(/\.[^.]+$/, '') + '.pdf', url }]);
      setStatus(`✅ ${file.name} → PDF ready`);
    } catch (e: any) {
      setStatus(`❌ ${file.name}: ${e.message}`);
    }
  };

  const handleConvertUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    files.forEach(convertFile);
    e.target.value = '';
  };

  const mergePdfs = async () => {
    if (items.length < 2) { setStatus(' Need at least 2 PDFs to merge'); return; }
    setStatus(' Merging PDFs...');
    try {
      const merged = await PDFDocument.create();
      for (const item of items) {
        const bytes = await fetch(item.url).then(r => r.arrayBuffer());
        const pdf = await PDFDocument.load(bytes);
        const pages = await merged.copyPages(pdf, pdf.getPageIndices());
        pages.forEach(p => merged.addPage(p));
      }
      const bytes = await merged.save();
      const blob = new Blob([bytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'KaraMerged.pdf'; a.click();
      setStatus(`✅ Merged ${items.length} PDFs → KaraMerged.pdf`);
    } catch (e: any) {
      setStatus(`❌ Merge failed: ${e.message}`);
    }
  };

  const removeItem = (id: string) => setItems(prev => prev.filter(i => i.id !== id));

  return (
    <div className="flex flex-col h-full bg-white">
      <div className="bg-slate-50 border-b border-slate-200 p-3 flex items-center gap-3 flex-wrap">
        <button onClick={() => setMode('convert')} className={`px-3 py-1.5 text-xs rounded ${mode==='convert'?'bg-blue-600 text-white':'bg-slate-200'}`}>Convert to PDF</button>
        <button onClick={() => setMode('merge')} className={`px-3 py-1.5 text-xs rounded ${mode==='merge'?'bg-purple-600 text-white':'bg-slate-200'}`}>Merge PDFs</button>
        <span className="text-[10px] text-slate-500 ml-auto">Kara PDF Engine — 100% local, no cloud</span>
      </div>

      {mode === 'convert' && (
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-blue-500 transition">
            <Upload className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="text-sm text-slate-600 mb-1">Drop files here or click to upload</p>
            <p className="text-[10px] text-slate-400">Supports: {SUPPORTED.join(', ')}</p>
            <input ref={fileInputRef} type="file" multiple accept={SUPPORTED.join(',')} onChange={handleConvertUpload} className="hidden" />
            <button onClick={() => fileInputRef.current?.click()} className="mt-3 px-4 py-2 bg-blue-600 text-white text-xs rounded hover:bg-blue-700">Choose Files</button>
          </div>
          {status && <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded">{status}</div>}
          {items.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Converted PDFs ({items.length})</h3>
              {items.map(item => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                  <FileText size={16} className="text-red-500" />
                  <span className="text-xs flex-1 truncate">{item.name}</span>
                  <a href={item.url} download={item.name} className="px-2 py-1 bg-emerald-600 text-white text-[10px] rounded hover:bg-emerald-700">Download</a>
                  <button onClick={() => removeItem(item.id)} className="p-1 text-slate-400 hover:text-red-500"><X size={14}/></button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {mode === 'merge' && (
        <div className="p-6 space-y-4">
          <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-purple-500 transition">
            <Merge className="mx-auto mb-2 text-slate-400" size={32} />
            <p className="text-sm text-slate-600 mb-1">Select 2+ PDFs to merge</p>
            <input ref={mergeInputRef} type="file" multiple accept=".pdf" onChange={handleConvertUpload} className="hidden" />
            <button onClick={() => mergeInputRef.current?.click()} className="mt-3 px-4 py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700">Choose PDFs</button>
          </div>
          {items.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-slate-700">Queue ({items.length} PDFs)</h3>
              {items.map((item, i) => (
                <div key={item.id} className="flex items-center gap-2 p-2 bg-slate-50 rounded border border-slate-200">
                  <span className="text-xs text-slate-400 w-6">#{i+1}</span>
                  <FileText size={16} className="text-red-500" />
                  <span className="text-xs flex-1 truncate">{item.name}</span>
                  <button onClick={() => removeItem(item.id)} className="p-1 text-slate-400 hover:text-red-500"><X size={14}/></button>
                </div>
              ))}
              <button onClick={mergePdfs} disabled={items.length < 2} className="w-full py-2 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50">
                Merge {items.length} PDFs → Download
              </button>
            </div>
          )}
          {status && <div className="text-xs text-slate-700 bg-slate-50 p-2 rounded">{status}</div>}
        </div>
      )}
    </div>
  );
}

