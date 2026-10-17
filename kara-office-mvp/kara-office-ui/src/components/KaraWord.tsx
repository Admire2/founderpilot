import { useState, useEffect } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import { Document, Packer, Paragraph, TextRun, PageBreak, HeadingLevel } from 'docx';
import { saveAs } from 'file-saver';
import { Search, X, Save, FileText, Type, Bold, Italic, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, FileDown } from 'lucide-react';

export default function KaraWord() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<{ from: number; to: number; preview: string }[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        horizontalRule: { HTMLAttributes: { class: 'page-break my-8 border-t-2 border-dashed border-slate-300' } },
      }),
      Placeholder.configure({ placeholder: 'Start typing or paste your document here...' }),
    ],
    content: '<h1>Welcome to Kara Word</h1><p>Paste your chat logs, reports, or notes here. This editor simulates A4 pages. Use the <b>Insert Page Break</b> button to start a new page, and the <b>Search</b> button to find any word instantly.</p>',
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none max-w-none p-12',
      },
    },
  });

  const performSearch = () => {
    if (!editor || !searchTerm.trim()) { setSearchResults([]); return; }
    const text = editor.state.doc.textBetween(0, editor.state.doc.content.size, '\n');
    const safeTerm = searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(safeTerm, 'gi');
    const results: { from: number; to: number; preview: string }[] = [];
    let match;
    while ((match = regex.exec(text)) !== null) {
      const from = match.index;
      const to = from + match[0].length;
      const start = Math.max(0, from - 40);
      const end = Math.min(text.length, to + 40);
      const preview = (start > 0 ? '...' : '') + text.slice(start, end) + (end < text.length ? '...' : '');
      results.push({ from, to, preview });
    }
    setSearchResults(results);
  };

  const jumpToResult = (from: number, to: number) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection({ from, to }).scrollIntoView().run();
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); performSearch(); }
    if (e.key === 'Escape') { setIsSearchOpen(false); setSearchResults([]); }
  };

  const saveAsDocx = async () => {
    if (!editor) return;
    const children: any[] = [];
    editor.state.doc.descendants((node: any) => {
      if (node.type.name === 'paragraph') {
        children.push(new Paragraph({ children: [new TextRun(node.textContent || ' ')] }));
      } else if (node.type.name === 'heading') {
        const level = node.attrs.level === 1 ? HeadingLevel.HEADING_1 : HeadingLevel.HEADING_2;
        children.push(new Paragraph({ heading: level, children: [new TextRun({ text: node.textContent || ' ', bold: true })] }));
      } else if (node.type.name === 'horizontalRule') {
        children.push(new Paragraph({ children: [new PageBreak()] }));
      }
      return true;
    });

    const doc = new Document({ sections: [{ children }] });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, 'KaraWord_Document.docx');
  };

  if (!editor) return null;

  return (
    <div className="h-full flex bg-slate-100 overflow-hidden">
      {isSearchOpen && (
        <div className="w-80 bg-white border-r border-slate-200 flex flex-col flex-shrink-0 shadow-lg z-20">
          <div className="p-3 border-b border-slate-200 flex items-center justify-between bg-slate-50">
            <h3 className="font-semibold text-sm text-slate-700 flex items-center gap-2"><Search size={16} /> Document Search</h3>
            <button onClick={() => { setIsSearchOpen(false); setSearchResults([]); }} className="text-slate-400 hover:text-slate-600"><X size={16} /></button>
          </div>
          <div className="p-3 border-b border-slate-200">
            <div className="flex gap-2">
              <input type="text" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} onKeyDown={handleSearchKeyDown} placeholder="Search for a word..." className="flex-1 border border-slate-300 rounded px-2 py-1.5 text-sm focus:ring-2 focus:ring-indigo-500 outline-none" autoFocus />
              <button onClick={performSearch} className="px-3 py-1.5 bg-indigo-600 text-white text-sm rounded hover:bg-indigo-700">Find</button>
            </div>
            <p className="text-[10px] text-slate-400 mt-1.5">{searchResults.length} occurrence{searchResults.length !== 1 ? 's' : ''} found</p>
          </div>
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {searchResults.length === 0 && searchTerm && <p className="text-sm text-slate-400 text-center py-4">No matches found.</p>}
            {searchResults.map((res, idx) => (
              <button key={idx} onClick={() => jumpToResult(res.from, res.to)} className="w-full text-left p-2 rounded hover:bg-indigo-50 border border-transparent hover:border-indigo-200 transition">
                <p className="text-[11px] font-mono text-slate-600 leading-relaxed break-words">
                  {res.preview.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, i) => 
                    part.toLowerCase() === searchTerm.toLowerCase() ? <span key={i} className="bg-yellow-200 text-slate-900 font-bold px-0.5 rounded">{part}</span> : part
                  )}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-full overflow-hidden">
        <div className="bg-white border-b border-slate-200 p-2 flex items-center gap-1 flex-wrap shadow-sm z-10">
          <button onClick={() => setIsSearchOpen(!isSearchOpen)} className={`p-2 rounded flex items-center gap-1.5 text-xs font-medium ${isSearchOpen ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600 hover:bg-slate-100'}`}>
            <Search size={16} /> Search
          </button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-2 rounded ${editor.isActive('bold') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`} title="Bold"><Bold size={16}/></button>
          <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-2 rounded ${editor.isActive('italic') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`} title="Italic"><Italic size={16}/></button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-2 rounded ${editor.isActive('bulletList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`} title="Bullet List"><List size={16}/></button>
          <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-2 rounded ${editor.isActive('orderedList') ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`} title="Numbered List"><ListOrdered size={16}/></button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={() => editor.chain().focus().setTextAlign('left').run()} className={`p-2 rounded ${editor.isActive({ textAlign: 'left' }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`} title="Align Left"><AlignLeft size={16}/></button>
          <button onClick={() => editor.chain().focus().setTextAlign('center').run()} className={`p-2 rounded ${editor.isActive({ textAlign: 'center' }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`} title="Align Center"><AlignCenter size={16}/></button>
          <button onClick={() => editor.chain().focus().setTextAlign('right').run()} className={`p-2 rounded ${editor.isActive({ textAlign: 'right' }) ? 'bg-slate-200 text-slate-900' : 'text-slate-600 hover:bg-slate-100'}`} title="Align Right"><AlignRight size={16}/></button>
          <div className="w-px h-6 bg-slate-200 mx-1"></div>
          <button onClick={() => editor.chain().focus().setHorizontalRule().run()} className="p-2 rounded text-slate-600 hover:bg-slate-100 flex items-center gap-1.5 text-xs font-medium" title="Insert Page Break">
            <FileText size={16} /> Page Break
          </button>
          <div className="flex-1"></div>
          <button onClick={saveAsDocx} className="px-3 py-1.5 bg-emerald-600 text-white text-xs rounded hover:bg-emerald-700 flex items-center gap-1.5">
            <FileDown size={14} /> Save as .docx
          a>
        </div>

        <div className="flex-1 overflow-y-auto bg-slate-200 p-8 flex justify-center">
          <div className="bg-white shadow-2xl min-w-[816px] min-h-[1056px] rounded-sm relative">
            <EditorContent editor={editor} />
          </div>
        </div>
      </div>
    </div>
  );
}
