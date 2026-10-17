import { useState, useRef, useEffect } from 'react';
import { Square, Circle, Type, Download, Trash2, ArrowUp, ArrowDown, Sparkles, Loader2, Image as ImageIcon, AlignCenterHorizontal, AlignCenterVertical, LayoutTemplate } from 'lucide-react';

type Shape = { id: string; type: 'rect' | 'circle' | 'text' | 'image'; x: number; y: number; w: number; h: number; text?: string; color: string; src?: string; fontSize?: number };

export default function KaraDesign() {
  const [shapes, setShapes] = useState<Shape[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [tool, setTool] = useState<'rect' | 'circle' | 'text'>('rect');
  const [canvasBg, setCanvasBg] = useState('#ffffff');
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiThinking, setAiThinking] = useState(false);
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [initialShape, setInitialShape] = useState<Shape | null>(null);

  const selectedShape = shapes.find(s => s.id === selectedId);

  const addShape = (override?: Partial<Shape>) => {
    if (!canvasRef.current) return;
    const newShape: Shape = {
      id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5), 
      type: tool, x: 50, y: 50, w: 120, h: tool === 'text' ? 40 : 120,
      text: tool === 'text' ? 'Text' : undefined, color: tool === 'text' ? '#0f172a' : '#6366f1',
      fontSize: 24, ...override
    };
    setShapes([...shapes, newShape]);
    setSelectedId(newShape.id);
  };

  const updateShape = (id: string, patch: Partial<Shape>) => setShapes(shapes.map(s => s.id === id ? { ...s, ...patch } : s));
  const delShape = (id: string) => { setShapes(shapes.filter(s => s.id !== id)); setSelectedId(null); };

  // Alignment Tools
  const centerHorizontal = () => {
    if (!selectedId || !canvasRef.current) return;
    const canvasWidth = canvasRef.current.clientWidth;
    updateShape(selectedId, { x: (canvasWidth - (selectedShape?.w || 0)) / 2 });
  };
  const centerVertical = () => {
    if (!selectedId || !canvasRef.current) return;
    const canvasHeight = canvasRef.current.clientHeight;
    updateShape(selectedId, { y: (canvasHeight - (selectedShape?.h || 0)) / 2 });
  };

  // Templates
  const applyTemplate = (type: 'social' | 'banner' | 'logo') => {
    setShapes([]); setSelectedId(null);
    if (type === 'social') {
      setCanvasBg('#f8fafc');
      addShape({ type: 'rect', x: 50, y: 50, w: 300, h: 300, color: '#3b82f6' });
      addShape({ type: 'text', x: 100, y: 150, w: 200, h: 50, text: 'Social Post', color: '#ffffff', fontSize: 32 });
    } else if (type === 'banner') {
      setCanvasBg('#ffffff');
      addShape({ type: 'rect', x: 0, y: 0, w: 800, h: 200, color: '#1e293b' });
      addShape({ type: 'text', x: 50, y: 70, w: 400, h: 60, text: 'Company Banner', color: '#ffffff', fontSize: 40 });
    } else if (type === 'logo') {
      setCanvasBg('#ffffff');
      addShape({ type: 'circle', x: 100, y: 100, w: 150, h: 150, color: '#ef4444' });
      addShape({ type: 'text', x: 280, y: 140, w: 200, h: 60, text: 'LOGO', color: '#0f172a', fontSize: 48 });
    }
  };

  // Image Upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        addShape({ type: 'image', x: 50, y: 50, w: 200, h: 200, color: 'transparent', src: ev.target?.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  // AI Design Assistant
  const generateDesign = async () => {
    if (!aiPrompt.trim()) return;
    setAiThinking(true);
    try {
      const res = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b',
          prompt: `You are a strict graphic design JSON generator. Generate a JSON array of shapes based on this request:  "${aiPrompt}". 
Rules: 
1. Each object must have: id (string), type ('rect', 'circle', or 'text'), x (number 50-700), y (number 50-500), w (number 100-300), h (number 100-300), color (hex string like '#ff0000'), and text (string, only for type 'text'). 
2. Create 3-5 shapes to make a complete composition. 
3. CRITICAL: If the request mentions specific text (e.g., 'Dangote Refinery'), you MUST create a shape with type: 'text' containing that exact text. 4. Output ONLY the raw JSON array, no markdown, no explanation.`,
          stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7
        })
      });
      const d = await res.json();
      let clean = (d.response || '').replace(/```json/g, '').replace(/```/g, '').trim();
      const start = clean.indexOf('[');
      const end = clean.lastIndexOf(']');
      if (start !== -1 && end !== -1) {
        const jsonStr = clean.substring(start, end + 1);
        const parsed = JSON.parse(jsonStr);
        const newShapes: Shape[] = parsed.map((s: any, i: number) => ({
          id: Date.now().toString(36) + i,
          type: ['rect', 'circle', 'text'].includes(s.type) ? s.type : 'rect',
          x: Math.max(0, Math.min(800, Number(s.x) || 50)),
          y: Math.max(0, Math.min(600, Number(s.y) || 50)),
          w: Math.max(20, Number(s.w) || 100),
          h: Math.max(20, Number(s.h) || 100),
          color: s.color || '#6366f1',
          text: s.type === 'text' ? (s.text || 'AI Text') : undefined,
          fontSize: 24
        }));
        setShapes(prev => [...prev, ...newShapes]);
      }
    } catch (e) {
      alert('AI offline. Ensure Ollama is running.');
    }
    setAiThinking(false);
    setAiPrompt('');
  };

  // Native Canvas Export
  const exportPNG = () => {
    window.dispatchEvent(new CustomEvent('kara-design-export', { detail: { title: 'Design export ' + new Date().toLocaleTimeString() } }));
    if (!canvasRef.current || shapes.length === 0) return;
    const canvas = document.createElement('canvas');
    canvas.width = canvasRef.current.clientWidth;
    canvas.height = canvasRef.current.clientHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = canvasBg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    shapes.forEach(s => {
      if (s.type === 'rect') {
        ctx.fillStyle = s.color;
        ctx.fillRect(s.x, s.y, s.w, s.h);
      } else if (s.type === 'circle') {
        ctx.fillStyle = s.color;
        ctx.beginPath();
        ctx.ellipse(s.x + s.w / 2, s.y + s.h / 2, s.w / 2, s.h / 2, 0, 0, 2 * Math.PI);
        ctx.fill();
      } else if (s.type === 'text') {
        ctx.font = `bold ${s.fontSize || 24}px sans-serif`;
        ctx.fillStyle = s.color;
        ctx.fillText(s.text || '', s.x, s.y + (s.fontSize || 24));
      } else if (s.type === 'image' && s.src) {
        const img = new window.Image();
        img.src = s.src;
        ctx.drawImage(img, s.x, s.y, s.w, s.h);
      }
    });

    const link = document.createElement('a');
    link.download = 'kara-design-' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  };

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent, id: string, isResizeHandle = false) => {
    e.stopPropagation();
    setSelectedId(id);
    const shape = shapes.find(s => s.id === id);
    if (!shape) return;
    setInitialShape(shape);
    setStartPos({ x: e.clientX, y: e.clientY });
    if (isResizeHandle) setIsResizing(true);
    else setIsDragging(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!initialShape || !selectedId) return;
      const dx = e.clientX - startPos.x;
      const dy = e.clientY - startPos.y;

      if (isDragging) {
        updateShape(selectedId, { x: initialShape.x + dx, y: initialShape.y + dy });
      } else if (isResizing) {
        updateShape(selectedId, { 
          w: Math.max(20, initialShape.w + dx), 
          h: Math.max(20, initialShape.h + dy) 
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
      setInitialShape(null);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, initialShape, selectedId, startPos]);

  return (
    <div className="h-full flex bg-slate-50">
      {/* Sidebar */}
      <div className="w-72 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 z-10 overflow-y-auto">
        {/* AI Section */}
        <div className="p-3 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2 mb-2 text-xs font-bold text-slate-700">
            <Sparkles size={14} className="text-purple-600"/> AI Design Assistant
          </div>
          <textarea 
            value={aiPrompt} 
            onChange={e => setAiPrompt(e.target.value)} 
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); generateDesign(); } }}
            placeholder="e.g., 'A red circle with a blue square next to it'"
            className="w-full border border-slate-200 rounded p-2 text-xs resize-none h-16 focus:ring-1 focus:ring-purple-500 outline-none"
          />
          <button 
            onClick={generateDesign} 
            disabled={aiThinking}
            className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-1.5 bg-purple-600 text-white text-xs rounded hover:bg-purple-700 disabled:opacity-50"
          >
            {aiThinking ? <Loader2 size={14} className="animate-spin"/> : <Sparkles size={14}/>} 
            {aiThinking ? 'Designing...' : 'Generate'}
          </button>
        </div>

        {/* Templates */}
        <div className="p-3 border-b border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2 flex items-center gap-1"><LayoutTemplate size={12}/> Quick Templates</div>
          <div className="flex gap-1">
            <button onClick={() => applyTemplate('social')} className="flex-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded p-1">Social</button>
            <button onClick={() => applyTemplate('banner')} className="flex-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded p-1">Banner</button>
            <button onClick={() => applyTemplate('logo')} className="flex-1 text-[10px] bg-slate-100 hover:bg-slate-200 rounded p-1">Logo</button>
          </div>
        </div>

        {/* Tools */}
        <div className="p-3 border-b border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Add Elements</div>
          <div className="grid grid-cols-4 gap-2 mb-2">
            <button onClick={() => { setTool('rect'); addShape(); }} className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 flex justify-center"><Square size={18}/></button>
            <button onClick={() => { setTool('circle'); addShape(); }} className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 flex justify-center"><Circle size={18}/></button>
            <button onClick={() => { setTool('text'); addShape(); }} className="p-2 bg-indigo-50 text-indigo-600 rounded hover:bg-indigo-100 flex justify-center"><Type size={18}/></button>
            <label className="p-2 bg-emerald-50 text-emerald-600 rounded hover:bg-emerald-100 flex justify-center cursor-pointer">
              <ImageIcon size={18}/>
              <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} />
            </label>
          </div>
        </div>

        {/* Selected Shape Properties */}
        {selectedShape && (
          <div className="p-3 border-b border-slate-200 flex flex-col gap-3">
            <div className="text-[10px] font-bold text-slate-400 uppercase">Properties</div>
            
            <div className="flex items-center gap-2">
              <label className="text-xs text-slate-600 w-12">Color:</label>
              <input type="color" value={selectedShape.color === 'transparent' ? '#ffffff' : selectedShape.color} onChange={e => updateShape(selectedShape.id, { color: e.target.value })} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
            </div>

            {selectedShape.type === 'text' && (
              <div className="flex items-center gap-2">
                <label className="text-xs text-slate-600 w-12">Size:</label>
                <input type="range" min="12" max="72" value={selectedShape.fontSize || 24} onChange={e => updateShape(selectedShape.id, { fontSize: Number(e.target.value) })} className="flex-1" />
                <span className="text-xs w-6">{selectedShape.fontSize}</span>
              </div>
            )}

            <div className="flex gap-1">
              <button onClick={centerHorizontal} className="flex-1 p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex justify-center" title="Center Horizontally"><AlignCenterHorizontal size={14}/></button>
              <button onClick={centerVertical} className="flex-1 p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex justify-center" title="Center Vertically"><AlignCenterVertical size={14}/></button>
              <button onClick={() => { const idx = shapes.findIndex(s => s.id === selectedId); if (idx < shapes.length - 1) { const n = [...shapes]; [n[idx], n[idx+1]] = [n[idx+1], n[idx]]; setShapes(n); } }} className="flex-1 p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex justify-center"><ArrowUp size={14}/></button>
              <button onClick={() => { const idx = shapes.findIndex(s => s.id === selectedId); if (idx > 0) { const n = [...shapes]; [n[idx], n[idx-1]] = [n[idx-1], n[idx]]; setShapes(n); } }} className="flex-1 p-1.5 bg-slate-100 text-slate-700 rounded hover:bg-slate-200 flex justify-center"><ArrowDown size={14}/></button>
              <button onClick={delShape} className="flex-1 p-1.5 bg-red-100 text-red-700 rounded hover:bg-red-200 flex justify-center"><Trash2 size={14}/></button>
            </div>
          </div>
        )}

        {/* Canvas Background */}
        <div className="p-3 border-b border-slate-200">
          <div className="text-[10px] font-bold text-slate-400 uppercase mb-2">Canvas Background</div>
          <div className="flex items-center gap-2">
            <input type="color" value={canvasBg} onChange={e => setCanvasBg(e.target.value)} className="w-8 h-8 rounded cursor-pointer border-0 p-0" />
            <span className="text-xs text-slate-600">{canvasBg}</span>
          </div>
        </div>

        <div className="flex-1"></div>
        
        {/* Export */}
        <div className="p-3 border-t border-slate-200">
          <button onClick={exportPNG} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700">
            <Download size={14}/> Export as PNG
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div ref={canvasRef} className="flex-1 relative m-4 rounded shadow-sm border border-slate-200 overflow-hidden" style={{ backgroundColor: canvasBg }} onClick={() => setSelectedId(null)}>
        {shapes.length === 0 && <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm pointer-events-none">Use AI, Templates, or Tools to start</div>}
        
        {shapes.map(s => (
          <div 
            key={s.id} 
            className={`absolute group ${selectedId === s.id ? 'ring-2 ring-indigo-500 ring-offset-2' : 'hover:ring-1 hover:ring-slate-300'}`}
            style={{ left: s.x, top: s.y, width: s.w, height: s.h, cursor: isDragging && selectedId === s.id ? 'grabbing' : 'grab' }}
            onMouseDown={(e) => handleMouseDown(e, s.id)}
          >
            {s.type === 'rect' && <div className="w-full h-full rounded opacity-90" style={{ backgroundColor: s.color }}></div>}
            {s.type === 'circle' && <div className="w-full h-full rounded-full opacity-90" style={{ backgroundColor: s.color }}></div>}
            {s.type === 'text' && (
              <input 
                value={s.text} 
                onChange={e => updateShape(s.id, { text: e.target.value })} 
                className="w-full h-full bg-transparent border-none outline-none font-bold pointer-events-auto"
                style={{ color: s.color, fontSize: `${s.fontSize || 24}px` }}
                onMouseDown={(e) => e.stopPropagation()}
              />
            )}
            {s.type === 'image' && s.src && <img src={s.src} className="w-full h-full object-cover pointer-events-none" alt="uploaded" />}
            
            {selectedId === s.id && (
              <div 
                className="absolute -bottom-1.5 -right-1.5 w-4 h-4 bg-white border-2 border-indigo-500 rounded-full cursor-nwse-resize z-20"
                onMouseDown={(e) => handleMouseDown(e, s.id, true)}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}


