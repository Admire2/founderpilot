import { useState, useEffect, useRef } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextStyle from '@tiptap/extension-text-style';
import { Color } from '@tiptap/extension-color';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import Placeholder from '@tiptap/extension-placeholder';
import KaraSheets from './components/KaraSheets';
import KaraPDF from './components/KaraPDF';
import { comparisonHTML } from './comparison';
import { FileText, Table as TableIcon, Presentation, FileBadge, Mail, StickyNote, Database, PenTool, Video, HardDrive, Kanban, Sparkles, Shield, Bot, Send, Loader2, LayoutDashboard, Plus, Terminal, Power, Save, FolderOpen, Search, RefreshCw, CalendarDays, Zap, Palette, Workflow } from 'lucide-react';
import KaraSlides from './components/KaraSlides';
import KaraMail from './components/KaraMail';
import KaraNotes from './components/KaraNotes';
import KaraBase from './components/KaraBase';
import KaraSync from './components/KaraSync';
import KaraCalendar from './components/KaraCalendar';
import KaraDrive from './components/KaraDrive';
import KaraSeek from './components/KaraSeek';
import { startConnectEngine } from './lib/connectEngine';
import KaraDesign from './components/KaraDesign';
import KaraConnect from './components/KaraConnect';
import KaraFlow from './components/KaraFlow';
import KaraIntelligence from './components/KaraIntelligence';
import { publishArtifact } from './lib/intelligence';

const FONTS = ['Calibri','Segoe UI','Arial','Times New Roman','Courier New','Georgia','Verdana','Tahoma','Cambria','Candara','Consolas','Constantia','Corbel','Trebuchet MS','Palatino Linotype','Garamond','Book Antiqua','Lucida Console','David','Miriam','Rod','Arial Hebrew','Traditional Arabic','Simplified Arabic','Nirmala UI','Mangal','SimSun','Microsoft YaHei','Meiryo','MS Gothic','Malgun Gothic','Leelawadee UI','Nyala'];
const SIZES = ['8pt','9pt','10pt','11pt','12pt','14pt','16pt','18pt','20pt','24pt','28pt','36pt','48pt','72pt'];

const DICT = new Set(('about above across after again against already also always among another around before being below between both brought build business called cannot change children country course different during early earth either enough every family father field first found friend give going good great group house however hundred include interest island issue itself large later leave letter light little matter might month morning mother move? much? name? never night nothing number often only? open? order other people place point power press public quite right road room? school second seem shall should show side since small soon state still story study take? tell? their there these thing think those three through time today together took toward town turn under until upon water week? well? went? were? what when where which while will? with? within without work world would write year? young customers dinner roller coaster london nigeria lagos lekki dangote akande joseph refinery sentence paragraph document computer software internet website email phone message friend morning evening today tomorrow yesterday because thought through someone anything everything nothing something company office market money price value trade export import energy power? water? food? health? education student teacher learner knowledge research science technology engineering agriculture farming harvest produce product service client customer supplier contract agreement payment invoice receipt balance profit loss budget forecast growth decline increase decrease remain continue start begin finish complete improve develop create design plan strategy goal target result outcome impact benefit risk challenge opportunity solution problem question answer report review meeting agenda minute action item owner deadline schedule timeline milestone deliverable quality standard policy process procedure system platform network security privacy data information knowledge insight wisdom experience skill talent ability capacity capability resource asset liability equity share stock bond fund capital investment return yield interest? rate tax duty levy fee charge cost expense spend save invest borrow lend lease rent hire recruit train mentor coach lead manage supervise coordinate collaborate communicate negotiate persuade influence inspire motivate encourage support guide direct control monitor evaluate assess measure analyze interpret summarize conclude recommend propose suggest advise consult inform notify remind alert warn caution protect defend guard shield secure encrypt backup restore recover resume pause stop halt cease quit exit enter join login logout signup subscribe unsubscribe upload download install uninstall configure customize personalize optimize maximize minimize streamline automate integrate synchronize harmonize balance align adjust adapt modify update upgrade downgrade replace swap exchange return refund cancel confirm approve reject accept decline allow permit forbid prohibit ban block unblock flag mark label tag category group cluster batch bundle package parcel shipment delivery logistics transport transit route path trail track trace follow pursue chase hunt search find locate discover uncover reveal expose display show hide conceal mask veil cover wrap pack unpack open close lock unlock key code cipher token session cookie cache buffer queue stack heap tree graph node edge link chain ring loop cycle round circle square triangle rectangle polygon sphere cube prism plane solid liquid gas plasma fire ice steam vapor mist fog rain snow hail wind storm thunder lightning cloud sky sun moon star planet galaxy universe space void null empty blank clean dirty dusty rusty shiny bright dim dark light? heavy soft hard rough smooth sharp blunt quick slow fast rapid swift steady stable firm loose tight near far close distant deep shallow high low wide narrow thick thin long? short? tall small? big? large? huge tiny mini macro micro nano pico').split(/\s+/).map(w => w.replace('?','')));
const ignoredTokens = new Set();

const KaraType = Extension.create({
  name: 'karaType',
  addGlobalAttributes() {
    return [{
      types: ['textStyle'],
      attributes: {
        karaFont: {
          default: { fontFamily: null, fontSize: null },
          parseHTML: element => ({ fontFamily: element.style.fontFamily || null, fontSize: element.style.fontSize || null }),
          renderHTML: attributes => {
            const kf = attributes.karaFont;
            if (!kf || (!kf.fontFamily && !kf.fontSize)) return {};
            const parts = [];
            if (kf.fontFamily) parts.push(`font-family: ${kf.fontFamily}`);
            if (kf.fontSize) parts.push(`font-size: ${kf.fontSize}`);
            return { style: parts.join('; ') };
          },
        },
      },
    }];
  },
});

const checkKey = new PluginKey('karaCheck');
let ghostStore = { text: '', pos: 0 };

function findIssues(text, base) {
  const issues = [];
  const fixes = { teh:'the', recieve:'receive', seperate:'separate', definately:'definitely', occured:'occurred', untill:'until', wich:'which', thier:'their', freind:'friend', beleive:'believe', accommodate:'accommodate', acheive:'achieve', tomorow:'tomorrow', busness:'business' };
  let m;
  const missp = new RegExp('\\b(' + Object.keys(fixes).join('|') + ')\\b', 'gi');
  while ((m = missp.exec(text))) issues.push({ from: base+m.index, to: base+m.index+m[0].length, msg: 'Spelling mistake', fix: fixes[m[0].toLowerCase()], alts: [] });
  const rep = /\b(\w+)\s+\1\b/gi;
  while ((m = rep.exec(text))) issues.push({ from: base+m.index, to: base+m.index+m[0].length, msg: 'Repeated word', fix: m[1], alts: [] });
  const aAn = /\b(a)\s+([aeiou]\w*)\b/gi;
  while ((m = aAn.exec(text))) issues.push({ from: base+m.index, to: base+m.index+m[0].length, msg: 'Use "an" before a vowel sound', fix: 'an ' + m[2], alts: [] });
  const cap = /([.!?])\s+([a-z])/g;
  while ((m = cap.exec(text))) {
    const p = m[1]; const ch = m[2];
    issues.push({ from: base+m.index, to: base+m.index+m[0].length, msg: 'Check punctuation and capital', fix: p + ' ' + ch.toUpperCase(), alts: [
      { label: 'Capital (new sentence)', text: p + ' ' + ch.toUpperCase() },
      { label: 'Full stop to comma', text: (p === '.' ? ', ' : p + ' ') + ch },
      { label: 'Remove stop, merge', text: ' ' + ch },
      { label: 'Semicolon', text: '; ' + ch },
    ] });
  }
  const commaUpper = /,\s*([A-Z][a-z]+)\b/g;
  while ((m = commaUpper.exec(text))) {
    const off = m.index + m[0].length - m[1].length;
    issues.push({ from: base+off, to: base+m.index+m[0].length, msg: 'Capital after comma', fix: m[1].toLowerCase(), alts: [
      { label: 'Small letter', text: m[1].toLowerCase() },
      { label: 'Keep capital (name)', text: m[1] },
    ] });
  }
  const spBefore = /([A-Za-z0-9])\s+([.!?,;:])/g;
  while ((m = spBefore.exec(text))) issues.push({ from: base+m.index, to: base+m.index+m[0].length, msg: 'Remove space before punctuation', fix: m[1] + m[2], alts: [] });
  const noAfter = /([.!?,:;])([A-Za-z])/g;
  while ((m = noAfter.exec(text))) {
    const p = m[1]; const ch = m[2];
    const isUpper = ch === ch.toUpperCase() && ch !== ch.toLowerCase();
    const issue = { from: base+m.index, to: base+m.index+m[0].length, msg: isUpper ? 'Punctuation glued to next word' : 'Missing space after punctuation', fix: p + ' ' + ch, alts: [] };
    if (isUpper && p === '.') {
      const low = ch.toLowerCase();
      issue.alts = [
        { label: 'Remove stop + small letter', text: ' ' + low },
        { label: 'Comma', text: ', ' + low },
        { label: 'Semicolon', text: '; ' + ch },
        { label: 'Colon', text: ': ' + ch },
        { label: 'Keep full stop', text: '. ' + ch },
      ];
    }
    issues.push(issue);
  }
  const joined = /\b([a-z]+)([A-Z][a-z]*)\b/g;
  while ((m = joined.exec(text))) issues.push({ from: base+m.index, to: base+m.index+m[0].length, msg: 'Words joined together', fix: m[1] + ' ' + m[2], alts: [] });
  const tokRe = /\b[a-z]{5,}\b/g; let t;
  while ((t = tokRe.exec(text))) {
    const w = t[0];
    if (DICT.has(w) || ignoredTokens.has(w)) continue;
    issues.push({ from: base+t.index, to: base+t.index+w.length, msg: 'Not in dictionary (possibly joined words)', fix: null, token: w, alts: [], dict: true });
  }
  return issues;
}

function buildDecorations(doc) {
  const decos = [];
  doc.descendants((node, pos) => {
    if (!node.isText) return;
    findIssues(node.text, pos).forEach(i => decos.push(Decoration.inline(i.from, i.to, { class: 'kara-err', 'data-msg': i.msg, 'data-fix': i.fix || '', 'data-token': i.token || '', 'data-dict': i.dict ? '1' : '0', 'data-alts': encodeURIComponent(JSON.stringify(i.alts || [])), 'data-from': i.from, 'data-to': i.to })));
  });
  if (ghostStore.text) {
    decos.push(Decoration.widget(ghostStore.pos, () => { const s = document.createElement('span'); s.className = 'kara-ghost'; s.textContent = ghostStore.text; return s; }, { side: 1 }));
  }
  return DecorationSet.create(doc, decos);
}

const KaraCheck = Extension.create({
  name: 'karaCheck',
  addProseMirrorPlugins() {
    return [new Plugin({
      key: checkKey,
      state: { init: (_, s) => buildDecorations(s.doc), apply: (tr, old, oldS, newS) => buildDecorations(newS.doc) },
      props: { decorations: state => checkKey.getState(state) },
    })];
  },
});

function App() {
    const params = new URLSearchParams(window.location.search);
  const isStandaloneWord = params.get('standalone') === 'word';
  const [activeApp, setActiveApp] = useState(isStandaloneWord ? 'word' : 'dashboard');
  const [aiMode, setAiMode] = useState('seek');
  const [prompt, setPrompt] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const [agentLogs, setAgentLogs] = useState([]);
  const [isThinking, setIsThinking] = useState(false);
  const [openMenu, setOpenMenu] = useState(null);
  const [zoom, setZoom] = useState(100);
  const [showStatus, setShowStatus] = useState(true);
  const [showFind, setShowFind] = useState(false);
  const [findTerm, setFindTerm] = useState('');
  const [replaceTerm, setReplaceTerm] = useState('');
  const [findStatus, setFindStatus] = useState('');
  const [writeAssist, setWriteAssist] = useState(true);
  const [sugg, setSugg] = useState(null);
  const [fontOpen, setFontOpen] = useState(false);
  const [showIntel, setShowIntel] = useState(false);
  useEffect(() => { startConnectEngine(); }, []);
  const editorRef = useRef(null);
  useEffect(() => { editorRef.current = editor; if (editor) editor.view.dom.setAttribute('spellcheck', 'false'); });
  useEffect(() => {
    const h = (e: Event) => { const ed = (editorRef as any).current; if (ed) ed.commands.setContent((e as CustomEvent).detail); };
    window.addEventListener('kara-word-load', h);
    return () => window.removeEventListener('kara-word-load', h);
  }, []);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [curFont, setCurFont] = useState('Calibri');
  const [curSize, setCurSize] = useState('12pt');
  const findIndexRef = useRef(0);
  const ghostTimer = useRef(null);

  const editor = useEditor({
    extensions: [
      StarterKit, Underline, TextStyle, KaraType, Color, Highlight, KaraCheck,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Table.configure({ resizable: true }), TableRow, TableCell, TableHeader,
      Link.configure({ openOnClick: false }), Image, Placeholder.configure({ placeholder: 'Start typing your document...' }),
    ],
    content: localStorage.getItem('karaWordDoc') || '',
    editorProps: { attributes: { spellcheck: 'false', autocorrect: 'off', autocapitalize: 'off' } },
    onUpdate: ({ editor }) => localStorage.setItem('karaWordDoc', editor.getHTML()),
  });

  useEffect(() => {
    if (!editor) return;
    const sel = () => {
      const { from, to, empty } = editor.state.selection;
      let fam = null, size = null;
      const read = marks => { const m = marks.find(mk => mk.type.name === 'textStyle'); if (m && m.attrs.karaFont) { fam = m.attrs.karaFont.fontFamily || fam; size = m.attrs.karaFont.fontSize || size; } };
      if (empty) read(editor.state.storedMarks || editor.state.selection.$head.marks());
      else editor.state.doc.nodesBetween(from, to, n => { if (n.isText) read(n.marks); });
      if (fam) setCurFont(fam);
      if (size) setCurSize(size);
    };
    editor.on('selectionUpdate', sel);
    return () => { editor.off('selectionUpdate', sel); };
  }, [editor]);

  const getCurrentType = () => {
    const { state } = editor.view;
    const { from, to, empty } = state.selection;
    let cur = { fontFamily: null, fontSize: null };
    const read = marks => { const m = marks.find(mk => mk.type.name === 'textStyle'); if (m && m.attrs.karaFont) cur = { fontFamily: m.attrs.karaFont.fontFamily || cur.fontFamily, fontSize: m.attrs.karaFont.fontSize || cur.fontSize }; };
    if (empty) read(state.storedMarks || state.selection.$head.marks());
    else state.doc.nodesBetween(from, to, n => { if (n.isText) read(n.marks); });
    return cur;
  };

  const applyFont = (family) => {
    if (!editor) return;
    const { state, dispatch } = editor.view;
    const markType = state.schema.marks.textStyle;
    const { from, to, empty } = state.selection;
    const cur = getCurrentType();
    const mark = markType.create({ karaFont: { fontFamily: family, fontSize: cur.fontSize } });
    const tr = empty ? state.tr.addStoredMark(mark) : state.tr.addMark(from, to, mark);
    dispatch(tr);
    setCurFont(family); setFontOpen(false); editor.view.focus();
  };

  const applySize = (size) => {
    if (!editor) return;
    const { state, dispatch } = editor.view;
    const markType = state.schema.marks.textStyle;
    const { from, to, empty } = state.selection;
    const cur = getCurrentType();
    const mark = markType.create({ karaFont: { fontFamily: cur.fontFamily, fontSize: size } });
    const tr = empty ? state.tr.addStoredMark(mark) : state.tr.addMark(from, to, mark);
    dispatch(tr);
    setCurSize(size); setSizeOpen(false); editor.view.focus();
  };

  const clearGhost = (ed) => {
    if (ghostStore.text) {
      ghostStore = { text: '', pos: 0 };
      ed.commands.command(({ tr, dispatch }) => { if (dispatch) dispatch(tr); return true; });
    }
  };

  useEffect(() => {
    if (!editor) return;
    const onSel = () => clearGhost(editor);
    const handler = ({ editor: ed }) => {
      clearGhost(ed);
      clearTimeout(ghostTimer.current);
      if (!writeAssist) return;
      ghostTimer.current = setTimeout(async () => {
        const sel = ed.state.selection;
        if (!sel.empty) return;
        if (sel.$from.parentOffset !== sel.$from.parent.content.size) return;
        const from = sel.from;
        const before = ed.state.doc.textBetween(Math.max(0, from - 160), from, ' ');
        if (before.trim().length < 15) return;
        try {
          const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: `Complete the sentence naturally. Return ONLY the completing words (max 10). No quotes, no newlines.\nSentence so far: ${before}`, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
          const data = await res.json();
          let comp = (data.response || '').replace(/[\n\r"]/g, ' ').trim();
          if (!comp || ed.state.selection.from !== from) return;
          ghostStore = { text: comp, pos: from };
          ed.commands.command(({ tr, dispatch }) => { if (dispatch) dispatch(tr); return true; });
        } catch (e) {}
      }, 900);
    };
    const kd = (e) => {
      if (ghostStore.text && (e.key === 'Backspace' || e.key === 'Delete' || e.key.indexOf('Arrow') === 0)) { clearGhost(editor); return; }
      if (e.key === 'Tab' && ghostStore.text) {
        e.preventDefault();
        const t = ghostStore.text; const pos = ghostStore.pos;
        ghostStore = { text: '', pos: 0 };
        editor.chain().focus().setTextSelection(pos).insertContent(t).run();
      }
      if (e.key === 'Escape' && ghostStore.text) clearGhost(editor);
    };
    editor.on('selectionUpdate', onSel);
    editor.on('update', handler);
    editor.view.dom.addEventListener('keydown', kd);
    return () => { editor.off('selectionUpdate', onSel); editor.off('update', handler); editor.view.dom.removeEventListener('keydown', kd); clearTimeout(ghostTimer.current); };
  }, [editor, writeAssist]);

  const onEditorClick = (e) => {
    const t = e.target.closest('.kara-err');
    if (t) {
      let alts = [];
      try { alts = JSON.parse(decodeURIComponent(t.dataset.alts || '[]')); } catch (err) {}
      const s = { x: e.clientX, y: e.clientY + 14, msg: t.dataset.msg, fix: t.dataset.fix || null, token: t.dataset.token || '', dict: t.dataset.dict === '1', alts, from: +t.dataset.from, to: +t.dataset.to };
      setSugg(s);
      aiSuggestFor(s);
      if (s.dict) splitFor(s);
    }
    else setSugg(null);
  };

  const applyAt = (from, to, f) => {
    if (!editor) return;
    editor.chain().focus().setTextSelection({ from, to }).insertContent(f).run();
    setSugg(null);
  };

  const ignoreWord = () => {
    if (!sugg || !editor) return;
    if (sugg.token) ignoredTokens.add(sugg.token);
    setSugg(null);
    editor.commands.command(({ tr, dispatch }) => { if (dispatch) dispatch(tr); return true; });
  };

  const sane = (t) => {
    const s = (t || '').replace(/[\n\r"]/g, ' ').trim();
    if (!s || s.length > 80) return null;
    if (/=>|corrected text|proper spaces|token|rewritten sentence|^ok$|^none$/i.test(s)) return null;
    return s;
  };

  const splitFor = async (s) => {
    if (!editor) return;
    try {
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: `The token below may be several English words glued without spaces. If so, reply exactly: split=word word word. If it is a real single word, reply exactly: split=NONE. Token: ${s.token}`, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const data = await res.json();
      const line = (data.response || '').split('\n').find(l => l.includes('split='));
      if (!line) return;
      const right = line.slice(line.indexOf('split=') + 6).trim();
      if (!right || right.toUpperCase() === 'NONE') return;
      const parts = right.toLowerCase().split(/\s+/).filter(Boolean);
      if (parts.length >= 2 && parts.join('') === s.token) {
        setSugg(prev => (prev && prev.from === s.from ? { ...prev, split: parts.join(' ') } : prev));
      }
    } catch (e) {}
  };

  const aiSuggestFor = async (s) => {
    if (!editor) return;
    const docSize = editor.state.doc.content.size;
    const before = editor.state.doc.textBetween(Math.max(0, s.from - 150), s.from, ' ');
    const under = editor.state.doc.textBetween(s.from, s.to, ' ');
    const after = editor.state.doc.textBetween(s.to, Math.min(docSize, s.to + 150), ' ');
    try {
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: `The part inside [[ ]] in the text below is wrong. Considering the words BEFORE and AFTER it, return ONLY the exact replacement string for the [[ ]] part so the whole text reads naturally. No quotes, no explanations.\n\n${before}[[${under}]]${after}`, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const data = await res.json();
      const phrase = sane(data.response);
      if (phrase) setSugg(prev => (prev && prev.from === s.from ? { ...prev, aiFix: phrase } : prev));
    } catch (e) {}
  };

  const aiSentenceFor = async (s) => {
    if (!editor) return;
    const size = editor.state.doc.content.size;
    const winB = editor.state.doc.textBetween(Math.max(0, s.from - 300), s.from, '\n');
    let cut = -1;
    ['. ', '! ', '? '].forEach(sep => { const i = winB.lastIndexOf(sep); if (i > cut) cut = i; });
    const sentFrom = cut === -1 ? Math.max(0, s.from - 300) : s.from - (winB.length - (cut + 2));
    const winA = editor.state.doc.textBetween(s.to, Math.min(size, s.to + 300), '\n');
    let end = -1;
    ['. ', '! ', '? '].forEach(sep => { const i = winA.indexOf(sep); if (i !== -1 && (end === -1 || i < end)) end = i; });
    const sentTo = end === -1 ? Math.min(size, s.to + 300) : s.to + end + 1;
    const sentence = editor.state.doc.textBetween(sentFrom, sentTo, ' ');
    try {
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: `Rewrite this sentence so it is grammatically correct and natural. Keep the same meaning and names. Return ONLY the rewritten sentence.\n\n${sentence}`, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const data = await res.json();
      const fixed = sane(data.response);
      if (fixed) setSugg(prev => (prev && prev.from === s.from ? { ...prev, sentFix: fixed, sentFrom: sentFrom, sentTo: sentTo } : prev));
    } catch (e) {}
  };

  const posFromIndex = (doc, index) => {
    let acc = 0; let target = null;
    doc.descendants((node, p) => { if (target !== null) return false; if (node.isText) { if (index >= acc && index < acc + node.text.length) target = p + (index - acc); acc += node.text.length; } return true; });
    return target;
  };

  const findNext = () => {
    if (!editor || !findTerm) return;
    const text = editor.state.doc.textContent.toLowerCase();
    const term = findTerm.toLowerCase();
    let idx = text.indexOf(term, findIndexRef.current);
    if (idx === -1) { idx = text.indexOf(term); findIndexRef.current = 0; if (idx === -1) { setFindStatus('No matches'); return; } }
    const from = posFromIndex(editor.state.doc, idx);
    if (from !== null) editor.chain().focus().setTextSelection({ from, to: from + term.length }).scrollIntoView().run();
    findIndexRef.current = idx + term.length; setFindStatus('Match found');
  };

  const replaceAll = () => {
    if (!editor || !findTerm) return;
    let count = 0, guard = 0;
    let text = editor.state.doc.textContent.toLowerCase();
    const term = findTerm.toLowerCase();
    let idx = text.indexOf(term);
    while (idx !== -1 && guard < 500) {
      const from = posFromIndex(editor.state.doc, idx);
      if (from === null) break;
      editor.chain().setTextSelection({ from, to: from + findTerm.length }).insertContent(replaceTerm).run();
      count++; guard++;
      text = editor.state.doc.textContent.toLowerCase();
      idx = text.indexOf(term, from + replaceTerm.length);
    }
    setFindStatus('Replaced ' + count + ' occurrence(s)');
  };

  const deriveName = () => {
    if (!editor) return 'KaraDocument';
    const text = editor.getText().trim();
    if (!text) return 'KaraDocument';
    const base = text.split(/\s+/).slice(0, 6).join(' ');
    return base.replace(/[^\w\d\- ]/g, '').trim().slice(0, 40) || 'KaraDocument';
  };

  const saveDoc = (ext) => {
    if (!editor) return;
    const suggested = deriveName();
    const name = window.prompt('Save As (file name):', suggested);
    if (name === null) return;
    const finalName = name.trim() || suggested;
    let content, mime;
    if (ext === 'doc') {
      content = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>' + finalName + '</title></head><body>' + editor.getHTML() + '</body></html>';
      mime = 'application/msword';
    } else if (ext === 'html') { content = editor.getHTML(); mime = 'text/html'; }
    else { content = editor.getText(); mime = 'text/plain'; }
    const blob = new Blob([content], { type: mime });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = finalName + '.' + ext; a.click(); URL.revokeObjectURL(a.href);
  };

  const openDoc = (e) => {
    const file = e.target.files[0]; if (!file || !editor) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target.result;
      if (file.name.endsWith('.txt')) editor.commands.setContent('<p>' + text.replace(/\n/g, '</p><p>') + '</p>');
      else editor.commands.setContent(text);
    };
    reader.readAsText(file); e.target.value = '';
  };

  const aiFixSelection = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) { alert('Select the text you want Kara to correct first.'); return; }
    const sel = editor.state.doc.textBetween(from, to, ' ');
    try {
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: `Correct grammar and spelling only. Keep the meaning identical. Return ONLY the corrected text.\n\n${sel}`, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const data = await res.json();
      editor.chain().focus().insertContent(data.response.trim()).run();
    } catch (e) { alert('Kara Local engine offline.'); }
  };

  const aiTranslateSelection = async () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    if (from === to) { alert('Select the text you want to translate first.'); return; }
    const lang = window.prompt('Translate selection to which language? (Arabic, Hebrew, French, Yoruba, Hausa, Igbo, Chinese...)');
    if (!lang) return;
    const sel = editor.state.doc.textBetween(from, to, ' ');
    try {
      const res = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: `Translate the following text into ${lang}. Return ONLY the translation, nothing else.\n\n${sel}`, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
      const data = await res.json();
      editor.chain().focus().insertContent(data.response.trim()).run();
    } catch (e) { alert('Kara Local engine offline.'); }
  };

  const downloadComparisonDoc = () => {
    const content = '<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:w="urn:schemas-microsoft-com:office:word"><head><meta charset="utf-8"><title>Kara vs The Giants</title></head><body>' + comparisonHTML() + '</body></html>';
    const blob = new Blob([content], { type: 'application/msword' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'Kara_vs_Microsoft_Comparison.doc'; a.click(); URL.revokeObjectURL(a.href);
  };

  const exec = (cmd) => { document.execCommand(cmd); };

  const copyRich = async () => {
    if (!editor) return;
    const html = '<div>' + editor.getHTML() + '</div>';
    try {
      await navigator.clipboard.write([new ClipboardItem({
        'text/html': new Blob([html], { type: 'text/html' }),
        'text/plain': new Blob([editor.getText()], { type: 'text/plain' }),
      })]);
      alert('Copied WITH formatting. Go to your email compose and press Ctrl+V.');
    } catch (e) {
      editor.commands.selectAll();
      document.execCommand('copy');
      alert('Copied. Press Ctrl+V in your email compose.');
    }
  };

  const copyPlain = async () => {
    if (!editor) return;
    try { await navigator.clipboard.writeText(editor.getText()); alert('Plain text copied. Ctrl+V anywhere.'); }
    catch (e) { alert('Copy failed.'); }
  };

  const insertLetterhead = () => {
    if (!editor) return;
    editor.chain().focus('start').insertContent('<h2>KARA OFFICE - Sovereign Productivity Suite</h2><p>Date: ' + new Date().toLocaleDateString() + ' | Author: </p><hr><p></p>').run();
  };

  const menus = editor ? [
    { name: 'File', items: [
      { label: 'New Document', action: () => editor.commands.clearContent() },
      { label: 'Open...', action: () => document.getElementById('kara-open-input').click() },
      { label: 'Save As .doc', shortcut: 'Ctrl+S', action: () => saveDoc('doc') },
      { label: 'Save As .html', action: () => saveDoc('html') },
      { label: 'Save As .txt', action: () => saveDoc('txt') },
      { sep: true },
      { label: 'Download Comparison Report (.doc)', action: () => downloadComparisonDoc() },
      { label: 'Print', shortcut: 'Ctrl+P', action: () => window.print() },
    ]},
    { name: 'Edit', items: [
      { label: 'Undo Typing', shortcut: 'Ctrl+Z', action: () => editor.commands.undo() },
      { label: 'Repeat', shortcut: 'Ctrl+Y', action: () => editor.commands.redo() },
      { sep: true },
      { label: 'Cut', shortcut: 'Ctrl+X', action: () => exec('cut') },
      { label: 'Copy', shortcut: 'Ctrl+C', action: () => exec('copy') },
      { label: 'Paste', shortcut: 'Ctrl+V', action: async () => { try { const t = await navigator.clipboard.readText(); editor.chain().focus().insertContent(t).run(); } catch(e){} } },
      { sep: true },
      { label: 'Select All', shortcut: 'Ctrl+A', action: () => editor.commands.selectAll() },
      { label: 'Find & Replace', shortcut: 'Ctrl+F', action: () => setShowFind(s => !s) },
    ]},
    { name: 'View', items: [
      { label: 'Zoom In', action: () => setZoom(z => Math.min(200, z + 10)) },
      { label: 'Zoom Out', action: () => setZoom(z => Math.max(50, z - 10)) },
      { label: 'Actual Size (100%)', action: () => setZoom(100) },
      { sep: true },
      { label: 'Toggle Text Direction (LTR/RTL)', action: () => { const dom = editor.view.dom; dom.dir = dom.dir === 'rtl' ? 'ltr' : 'rtl'; } },
      { label: showStatus ? 'Hide Status Bar' : 'Show Status Bar', action: () => setShowStatus(s => !s) },
      { label: 'Full Screen', action: () => document.documentElement.requestFullscreen() },
    ]},
    { name: 'Insert', items: [
      { label: 'Image...', action: () => { const url = window.prompt('Image URL:'); if (url) editor.chain().focus().setImage({ src: url }).run(); } },
      { label: 'Link...', shortcut: 'Ctrl+K', action: () => { const url = window.prompt('Link URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); } },
      { label: 'Table 3x3', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: 'Table 5x5', action: () => editor.chain().focus().insertTable({ rows: 5, cols: 5, withHeaderRow: true }).run() },
      { label: 'Horizontal Line', action: () => editor.chain().focus().setHorizontalRule().run() },
      { label: 'Code Block', action: () => editor.chain().focus().toggleCodeBlock().run() },
      { label: 'Date & Time', action: () => editor.chain().focus().insertContent(new Date().toLocaleString()).run() },
      { label: 'Kara Letterhead (brand header)', action: insertLetterhead },
    ]},
    { name: 'Format', items: [
      { label: 'Bold', shortcut: 'Ctrl+B', action: () => editor.commands.toggleBold() },
      { label: 'Italic', shortcut: 'Ctrl+I', action: () => editor.commands.toggleItalic() },
      { label: 'Underline', shortcut: 'Ctrl+U', action: () => editor.commands.toggleUnderline() },
      { label: 'Strikethrough', action: () => editor.commands.toggleStrike() },
      { label: 'Highlight', action: () => editor.commands.toggleHighlight() },
      { sep: true },
      { label: 'Heading 1', action: () => editor.commands.toggleHeading({ level: 1 }) },
      { label: 'Heading 2', action: () => editor.commands.toggleHeading({ level: 2 }) },
      { label: 'Heading 3', action: () => editor.commands.toggleHeading({ level: 3 }) },
      { sep: true },
      { label: 'Align Left', action: () => editor.commands.setTextAlign('left') },
      { label: 'Align Center', action: () => editor.commands.setTextAlign('center') },
      { label: 'Align Right', action: () => editor.commands.setTextAlign('right') },
      { label: 'Justify', action: () => editor.commands.setTextAlign('justify') },
      { sep: true },
      { label: 'Clear Formatting', action: () => editor.chain().focus().clearNodes().unsetAllMarks().run() },
    ]},
    { name: 'Tools', items: [
      { label: writeAssist ? 'Ã¢Å“â€œ Kara Write Assist (AI completion)' : '   Kara Write Assist (AI completion)', action: () => setWriteAssist(w => !w) },
      { label: 'AI: Fix Grammar in Selection', action: aiFixSelection },
      { label: 'AI: Translate Selection...', action: aiTranslateSelection },
      { sep: true },
      { label: 'Word Count', action: () => { const t = editor.getText().trim(); alert('Words: ' + (t ? t.split(/\s+/).length : 0) + '\nCharacters: ' + t.length); } },
      { label: 'Clear Document', action: () => { if (window.confirm('Clear the entire document?')) editor.commands.clearContent(); } },
    ]},
    { name: 'Table', items: [
      { label: 'Insert Table 3x3', action: () => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run() },
      { label: 'Add Row Below', action: () => editor.commands.addRowAfter() },
      { label: 'Add Column Right', action: () => editor.commands.addColumnAfter() },
      { label: 'Delete Row', action: () => editor.commands.deleteRow() },
      { label: 'Delete Column', action: () => editor.commands.deleteColumn() },
      { label: 'Delete Table', action: () => editor.commands.deleteTable() },
    ]},
    { name: 'Help', items: [
      { label: 'About Kara Word', action: () => alert('Kara Word Ã¢â‚¬â€ part of the Kara Office Suite.\nBuilt by Karakata. 100% sovereign technology.') },
      { label: 'Keyboard Shortcuts', action: () => alert('Ctrl+B Bold | Ctrl+I Italic | Ctrl+U Underline\nCtrl+Z Undo | Ctrl+Y Redo | Ctrl+K Link\nCtrl+F Find | TAB = accept AI completion | ESC = dismiss') },
    ]},
  ] : [];

  const [notes, setNotes] = useState(() => {
    const saved = localStorage.getItem('karaNotes');
    return saved ? JSON.parse(saved) : [{ id: 1, title: 'Welcome to Kara Notes', content: 'Start typing...' }];
  });
  const [activeNoteId, setActiveNoteId] = useState(notes[0]?.id || null);
  useEffect(() => { localStorage.setItem('karaNotes', JSON.stringify(notes)); }, [notes]);
  const addNote = () => { const newNote = { id: Date.now(), title: 'Untitled Note', content: '' }; setNotes([newNote, ...notes]); setActiveNoteId(newNote.id); };
  const updateNote = (field, value) => { setNotes(notes.map(n => n.id === activeNoteId ? { ...n, [field]: value } : n)); };
  const activeNote = notes.find(n => n.id === activeNoteId);

  const suiteApps = [
    { id: 'word', name: 'Kara Word', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50', category: 'Core' },
    { id: 'sheets', name: 'Kara Sheets', icon: TableIcon, color: 'text-emerald-500', bg: 'bg-emerald-50', category: 'Core' },
    { id: 'slides', name: 'Kara Slides', icon: Presentation, color: 'text-orange-500', bg: 'bg-orange-50', category: 'Core' },
    { id: 'mail', name: 'Kara Mail', icon: Mail, color: 'text-blue-500', bg: 'bg-blue-50', category: 'Core' },
    { id: 'base', name: 'Kara Base', icon: Database, color: 'text-indigo-500', bg: 'bg-indigo-50', category: 'Core' },
            { id: 'sync', name: 'Kara Sync', icon: RefreshCw, color: 'text-teal-500', bg: 'bg-teal-50', category: 'Core' },
            { id: 'calendar', name: 'Kara Calendar', icon: CalendarDays, color: 'text-amber-500', bg: 'bg-amber-50', category: 'Core' },
            { id: 'flow', name: 'Kara Flow', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50', category: 'Core' },
            { id: 'connect', name: 'Kara Connect', icon: Workflow, color: 'text-purple-500', bg: 'bg-purple-50', category: 'Core' },
            { id: 'design', name: 'Kara Design', icon: Palette, color: 'text-pink-500', bg: 'bg-pink-50', category: 'Core' },
            { id: 'seek', name: 'Kara Seek', icon: Search, color: 'text-cyan-500', bg: 'bg-cyan-50', category: 'Core' },
            { id: 'drive', name: 'Kara Drive', icon: HardDrive, color: 'text-emerald-500', bg: 'bg-emerald-50', category: 'Core' },
            { id: 'notes', name: 'Kara Notes', icon: StickyNote, color: 'text-yellow-500', bg: 'bg-yellow-50', category: 'Core' },
  ];

  const handleExecute = async () => {
    if (!prompt.trim() || aiMode === 'off') return;
    setIsThinking(true); setAiResponse(''); setAgentLogs([]);
    const promptToSend = prompt; setPrompt('');
    try {
      if (aiMode === 'seek') {
        const response = await fetch('http://localhost:3001/api/seek', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ goal: promptToSend }) });
        const data = await response.json();
        if (data.success) { setAgentLogs(data.logs); setAiResponse(data.answer); publishArtifact('seek', promptToSend, data.answer); } else setAiResponse('Agent failed.');
      } else if (aiMode === 'cloud') {
        const response = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: `You are Kara Cloud, a fast smart cloud AI. Year 2026. User: ${promptToSend}`, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
        const data = await response.json(); setAiResponse(data.response); publishArtifact('seek', promptToSend, data.response);
      } else if (aiMode === 'local') {
        const response = await fetch('http://localhost:11434/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ model: ((window as any).__karaAi || {}).model || 'qwen2.5:3b', prompt: `Offline text assistant. Task: ${promptToSend}`, stream: false, temperature: ((window as any).__karaAi || {}).temperature ?? 0.7 }) });
        const data = await response.json(); setAiResponse(data.response); publishArtifact('seek', promptToSend, data.response);
      }
    } catch (e) { setAiResponse('Ã¢Å¡Â Ã¯Â¸Â Engine error.'); setPrompt(promptToSend); }
    finally { setIsThinking(false); }
  };
  const handleKeyDown = (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleExecute(); } };

  const btn = (active) => 'px-2 py-1 rounded text-xs ' + (active ? 'bg-blue-100 text-blue-700' : 'text-slate-600 hover:bg-slate-100');

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 overflow-hidden">
      <style>{`
        .ProseMirror { min-height: 1000px; padding: 48px 64px; outline: none; font-family: Calibri, 'Segoe UI', sans-serif; font-size: 16px; }
        .ProseMirror table { border-collapse: collapse; width: 100%; margin: 12px 0; }
        .ProseMirror td, .ProseMirror th { border: 1px solid #94a3b8; padding: 6px 10px; min-width: 80px; }
        .ProseMirror th { background: #f1f5f9; font-weight: 600; }
        .ProseMirror p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #9ca3af; float: left; height: 0; pointer-events: none; }
        .ProseMirror img { max-width: 100%; }
        .ProseMirror pre { background: #0f172a; color: #e2e8f0; padding: 12px; border-radius: 8px; overflow-x: auto; }
        .kara-err { text-decoration: underline wavy #ef4444 1.5px; text-underline-offset: 3px; cursor: pointer; }
        .kara-err:hover { background: #fee2e2; }
        .kara-ghost { color: #9ca3af; }
        @media print {
          body * { visibility: hidden; }
          .print-area, .print-area * { visibility: visible; }
          .print-area { position: absolute; left: 0; top: 0; width: 100%; min-height: auto !important; box-shadow: none !important; margin: 0 !important; }
          .ProseMirror { padding: 24px 32px !important; min-height: auto !important; font-size: 12pt; }
        }
      `}</style>
      <input id="kara-open-input" type="file" hidden accept=".doc,.html,.txt" onChange={openDoc} />

      {sugg && (
        <div style={{ left: sugg.x, top: sugg.y }} className="fixed z-50 bg-white border border-slate-300 shadow-2xl rounded-lg p-3 w-96">
          <p className="text-xs font-semibold text-red-600 mb-1">{sugg.msg}</p>
          <div className="flex flex-wrap gap-2 mb-2">
            {sugg.fix && <button onClick={() => applyAt(sugg.from, sugg.to, sugg.fix)} className="px-2 py-1 bg-blue-600 text-white text-xs rounded">Apply: "{sugg.fix}"</button>}
            {sugg.alts && sugg.alts.map((a, i) => (
              <button key={i} onClick={() => applyAt(sugg.from, sugg.to, a.text)} className="px-2 py-1 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs rounded hover:bg-emerald-100">{a.label} Ã¢â€ â€™ "{a.text}"</button>
            ))}
            {sugg.split && <button onClick={() => applyAt(sugg.from, sugg.to, sugg.split)} className="px-2 py-1 bg-emerald-600 text-white text-xs rounded">Apply split: "{sugg.split}"</button>}
          </div>
          {sugg.dict && !sugg.split && <p className="text-[10px] text-slate-400 mb-2">Kara AI is splitting the joined word...</p>}
          {sugg.aiFix && <p className="text-xs text-purple-700 mb-2 bg-purple-50 border border-purple-200 rounded p-1.5">Kara AI (context): <b>{sugg.aiFix}</b> <button onClick={() => applyAt(sugg.from, sugg.to, sugg.aiFix)} className="ml-1 px-2 py-0.5 bg-purple-600 text-white rounded">Apply</button></p>}
          {sugg.sentFix && <p className="text-xs text-indigo-700 mb-2 bg-indigo-50 border border-indigo-200 rounded p-1.5">Kara AI sentence: <b>{sugg.sentFix}</b> <button onClick={() => applyAt(sugg.sentFrom, sugg.sentTo, sugg.sentFix)} className="ml-1 px-2 py-0.5 bg-indigo-600 text-white rounded">Apply</button></p>}
          <div className="flex flex-wrap gap-2">
            {!sugg.sentFix && <button onClick={() => aiSentenceFor(sugg)} className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded">Rewrite whole sentence</button>}
            {sugg.dict && <button onClick={ignoreWord} className="px-2 py-1 bg-slate-200 text-slate-700 text-xs rounded">Ignore word</button>}
            <button onClick={() => setSugg(null)} className="px-2 py-1 bg-slate-100 text-slate-600 text-xs rounded">Dismiss</button>
          </div>
        </div>
      )}

      <div className="w-64 bg-slate-900 text-white flex flex-col border-r border-slate-700 flex-shrink-0">
        <div className="p-4 border-b border-slate-700">
          <h1 className="text-xl font-bold flex items-center gap-2"><span className="text-blue-400">Kara</span>Office</h1>
          <p className="text-xs text-slate-400 mt-1">Suite v1.0</p>
        </div>
        <div className="p-4 flex-1 overflow-y-auto">
          <button onClick={() => setActiveApp('dashboard')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-2 transition ${activeApp === 'dashboard' ? 'bg-blue-600 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
            <LayoutDashboard size={18} /> Dashboard
          </button>
          <p className="text-xs text-slate-500 uppercase font-semibold mt-4 mb-2 px-3">Core Apps</p>
          {suiteApps.filter(a => a.category === 'Core').map((app) => (
            <button key={app.id} onClick={() => setActiveApp(app.id)} className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg mb-1 transition ${activeApp === app.id ? 'bg-slate-700 text-white' : 'text-slate-300 hover:bg-slate-800'}`}>
              <app.icon size={18} className={app.color} /> <span className="text-sm">{app.name}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <div className="h-12 bg-white border-b border-slate-200 flex items-center justify-between px-6 shadow-sm flex-shrink-0">
          <div className="flex items-center gap-3">
            {activeApp === 'dashboard' ? <span className="font-semibold text-lg">Welcome to Kara Office</span> : (
              <>
                <div className={`p-1.5 rounded ${suiteApps.find(a => a.id === activeApp)?.bg}`}>
                  {(() => { const Icon = suiteApps.find(a => a.id === activeApp)?.icon; return Icon ? <Icon size={20} className={suiteApps.find(a => a.id === activeApp)?.color} /> : null; })()}
                </div>
                <span className="font-semibold text-lg">{suiteApps.find(a => a.id === activeApp)?.name}</span>
              </>
            )}
          </div>
          <button onClick={() => setShowIntel(true)} className="mr-2 px-3 py-1.5 bg-slate-900 text-white text-xs rounded hover:bg-slate-700">Kara Intelligence</button>
          <div className="flex items-center gap-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setAiMode('off')} className={`px-2 py-1.5 text-[10px] rounded transition flex items-center gap-1 ${aiMode === 'off' ? 'bg-slate-300 text-slate-700 shadow' : 'text-slate-500'}`}><Power size={10} /> Off</button>
            <button onClick={() => setAiMode('seek')} className={`px-2 py-1.5 text-[10px] rounded transition flex items-center gap-1 ${aiMode === 'seek' ? 'bg-purple-100 text-purple-700 shadow' : 'text-slate-500'}`}><Bot size={10} /> Seek (Pro)</button>
            <button onClick={() => setAiMode('cloud')} className={`px-2 py-1.5 text-[10px] rounded transition flex items-center gap-1 ${aiMode === 'cloud' ? 'bg-blue-100 text-blue-700 shadow' : 'text-slate-500'}`}><Sparkles size={10} /> Cloud</button>
            <button onClick={() => setAiMode('local')} className={`px-2 py-1.5 text-[10px] rounded transition flex items-center gap-1 ${aiMode === 'local' ? 'bg-emerald-100 text-emerald-700 shadow' : 'text-slate-500'}`}><Shield size={10} /> Local</button>
          </div>
        </div>

        <div className="flex-1 flex bg-slate-100 overflow-hidden">
          <div className="flex-1 relative overflow-hidden flex flex-col">

            {activeApp === 'dashboard' && (
              <div className="p-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 h-full overflow-y-auto content-start w-full">
                {suiteApps.map((app) => (
                  <button key={app.id} onClick={() => setActiveApp(app.id)} className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition flex flex-col items-center text-center group">
                    <div className={`p-4 rounded-full ${app.bg} mb-4 group-hover:scale-110 transition`}><app.icon size={32} className={app.color} /></div>
                    <h3 className="font-semibold text-slate-800">{app.name}</h3>
                  </button>
                ))}
              </div>
            )}

            {activeApp === 'word' && editor && (
              <>
                <div className="bg-white border-b border-slate-300 px-2 flex items-center flex-shrink-0 relative z-40">
                  {menus.map(m => (
                    <div key={m.name} className="relative">
                      <button onClick={() => setOpenMenu(openMenu === m.name ? null : m.name)} className={`px-3 py-1.5 text-xs ${openMenu === m.name ? 'bg-blue-600 text-white' : 'text-slate-700 hover:bg-slate-100'}`}>{m.name}</button>
                      {openMenu === m.name && (
                        <div className="absolute left-0 top-full bg-white border border-slate-200 shadow-xl w-64 py-1 z-50">
                          {m.items.map((it, i) => it.sep ? <div key={i} className="border-t border-slate-100 my-1" /> : (
                            <button key={i} onClick={() => { it.action(); setOpenMenu(null); }} className="w-full flex justify-between px-4 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700">
                              <span>{it.label}</span><span className="text-slate-400">{it.shortcut || ''}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                  <div className="ml-auto flex items-center gap-1 pr-2">
                    <button onClick={() => saveDoc('doc')} className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700"><Save size={12}/> Save As</button>
                    <button onClick={() => document.getElementById('kara-open-input').click()} className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded hover:bg-slate-200"><FolderOpen size={12}/> Open</button>
                    <button onClick={copyRich} className="flex items-center gap-1 px-3 py-1 bg-indigo-600 text-white text-xs rounded hover:bg-indigo-700">Copy Rich</button>
                    <button onClick={() => { publishArtifact('word', deriveName(), editor.getText()); alert('Published to Kara Intelligence.'); }} className="px-3 py-1 bg-slate-800 text-white text-xs rounded hover:bg-slate-700">Publish</button>
                    <button onClick={copyPlain} className="flex items-center gap-1 px-3 py-1 bg-slate-100 text-slate-700 text-xs rounded hover:bg-slate-200">Copy Text</button>
                  </div>
                </div>

                <div className="bg-white border-b border-slate-200 px-3 py-1.5 flex items-center gap-1 flex-wrap flex-shrink-0">
                  <button className={btn()} onClick={() => editor.commands.undo()}>Ã¢â€ Â¶</button>
                  <button className={btn()} onClick={() => editor.commands.redo()}>Ã¢â€ Â·</button>
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <div className="relative">
                    <button onClick={() => { setFontOpen(o => !o); setSizeOpen(false); }} className="border border-slate-200 rounded text-xs py-1 px-2 w-44 flex justify-between items-center bg-white hover:bg-slate-50">
                      <span style={{ fontFamily: curFont }}>{curFont}</span><span className="text-slate-400">Ã¢â€“Â¾</span>
                    </button>
                    {fontOpen && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 shadow-2xl w-80 max-h-80 overflow-auto z-50 py-1">
                        {FONTS.map(f => (
                          <button key={f} onClick={() => applyFont(f)} className={`w-full flex items-center gap-3 px-3 py-1.5 text-left hover:bg-blue-50 ${curFont === f ? 'bg-blue-100' : ''}`}>
                            <span className="text-slate-500 w-28 truncate" style={{ fontFamily: f, fontSize: '15px' }}>AaBbCcZz</span>
                            <span className="text-slate-800" style={{ fontFamily: f, fontSize: '15px' }}>{f}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="relative">
                    <button onClick={() => { setSizeOpen(o => !o); setFontOpen(false); }} className="border border-slate-200 rounded text-xs py-1 px-2 w-16 flex justify-between items-center bg-white hover:bg-slate-50">
                      <span>{curSize}</span><span className="text-slate-400">Ã¢â€“Â¾</span>
                    </button>
                    {sizeOpen && (
                      <div className="absolute left-0 top-full mt-1 bg-white border border-slate-200 shadow-2xl w-24 max-h-72 overflow-auto z-50 py-1">
                        {SIZES.map(s => (
                          <button key={s} onClick={() => applySize(s)} className={`w-full px-3 py-1 text-left hover:bg-blue-50 ${curSize === s ? 'bg-blue-100' : ''}`} style={{ fontSize: s }}>{s}</button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <button className={btn(editor.isActive('bold'))} onClick={() => editor.chain().focus().toggleBold().run()}><b>B</b></button>
                  <button className={btn(editor.isActive('italic'))} onClick={() => editor.chain().focus().toggleItalic().run()}><i>I</i></button>
                  <button className={btn(editor.isActive('underline'))} onClick={() => editor.chain().focus().toggleUnderline().run()}><u>U</u></button>
                  <button className={btn(editor.isActive('strike'))} onClick={() => editor.chain().focus().toggleStrike().run()}><s>S</s></button>
                  <button className={btn(editor.isActive('highlight'))} onClick={() => editor.chain().focus().toggleHighlight().run()}>Ã°Å¸â€“Â</button>
                  <select className="border border-slate-200 rounded text-xs py-1 px-1" defaultValue="" onChange={(e) => e.target.value && editor.chain().focus().setColor(e.target.value).run()}>
                    <option value="">A Color</option>
                    {['#000000','#ef4444','#f97316','#eab308','#22c55e','#3b82f6','#8b5cf6','#ec4899'].map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <button className={btn(editor.isActive('bulletList'))} onClick={() => editor.chain().focus().toggleBulletList().run()}>Ã¢â‚¬Â¢ List</button>
                  <button className={btn(editor.isActive('orderedList'))} onClick={() => editor.chain().focus().toggleOrderedList().run()}>1. List</button>
                  <button className={btn()} onClick={() => editor.chain().focus().sinkListItem('listItem').run()}>Ã¢â€¡Â¥ Indent</button>
                  <button className={btn()} onClick={() => editor.chain().focus().liftListItem('listItem').run()}>Ã¢â€¡Â¤ Outdent</button>
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <button className={btn(editor.isActive({ textAlign: 'left' }))} onClick={() => editor.chain().focus().setTextAlign('left').run()}>Ã¢Â¬â€¦</button>
                  <button className={btn(editor.isActive({ textAlign: 'center' }))} onClick={() => editor.chain().focus().setTextAlign('center').run()}>Ã¢ËœÂ°</button>
                  <button className={btn(editor.isActive({ textAlign: 'right' }))} onClick={() => editor.chain().focus().setTextAlign('right').run()}>Ã¢Å¾Â¡</button>
                  <button className={btn(editor.isActive({ textAlign: 'justify' }))} onClick={() => editor.chain().focus().setTextAlign('justify').run()}>Ã¢Â¬Å’</button>
                  <span className="w-px h-5 bg-slate-200 mx-1"></span>
                  <button className={btn()} onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}>Ã¢Å Å¾ Table</button>
                  <button className={btn()} onClick={() => { const url = window.prompt('Image URL:'); if (url) editor.chain().focus().setImage({ src: url }).run(); }}>Ã°Å¸â€“Â¼</button>
                  <button className={btn()} onClick={() => { const url = window.prompt('Link URL:'); if (url) editor.chain().focus().setLink({ href: url }).run(); }}>Ã°Å¸â€â€”</button>
                  <button className={btn()} onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}>Ã¢Å’Â« Clear</button>
                </div>

                {showFind && (
                  <div className="bg-amber-50 border-b border-amber-200 px-4 py-2 flex items-center gap-2 flex-shrink-0">
                    <Search size={14} className="text-amber-600" />
                    <input value={findTerm} onChange={(e) => setFindTerm(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && findNext()} className="border border-slate-200 rounded px-2 py-1 text-xs w-44" placeholder="Find..." />
                    <input value={replaceTerm} onChange={(e) => setReplaceTerm(e.target.value)} className="border border-slate-200 rounded px-2 py-1 text-xs w-44" placeholder="Replace with..." />
                    <button onClick={findNext} className="px-2 py-1 bg-slate-800 text-white text-xs rounded">Find Next</button>
                    <button onClick={replaceAll} className="px-2 py-1 bg-amber-600 text-white text-xs rounded">Replace All</button>
                    <span className="text-[10px] text-amber-700">{findStatus}</span>
                    <button onClick={() => setShowFind(false)} className="ml-auto text-slate-400 text-xs">Ã¢Å“â€¢</button>
                  </div>
                )}

                <div className="flex-1 overflow-auto bg-slate-200 p-6" onClick={onEditorClick}>
                  <div style={{ zoom: zoom / 100 }} className="mx-auto max-w-4xl">
                    <div className="bg-white shadow-lg print-area" style={{ minHeight: '1123px' }}>
                      <EditorContent editor={editor} />
                    </div>
                  </div>
                </div>

                {showStatus && (
                  <div className="h-7 bg-slate-900 text-white text-[11px] flex items-center px-4 gap-6 flex-shrink-0">
                    <span>Page 1 of 1</span>
                    <span>Words: {editor.getText().trim() ? editor.getText().trim().split(/\s+/).length : 0}</span>
                    <span>Characters: {editor.getText().trim().length}</span>
                    <span>Zoom: {zoom}%</span>
                    <span className={writeAssist ? 'text-emerald-400' : 'text-slate-500'}>Write Assist: {writeAssist ? 'On' : 'Off'}</span>
                    <span className="ml-auto">Kara Word</span>
                  </div>
                )}
              </>
            )}

            {activeApp === 'pdf' && <KaraPDF />}
            {activeApp === 'mail' && <KaraMail />}
            {activeApp === 'notes' && <KaraNotes />}
            {activeApp === 'base' && <KaraBase />}
            {activeApp === 'sync' && <KaraSync />}
            {activeApp === 'calendar' && <KaraCalendar />}
            {activeApp === 'drive' && <KaraDrive />}
            {activeApp === 'seek' && <KaraSeek />}
            {activeApp === 'design' && <KaraDesign />}
            {activeApp === 'connect' && <KaraConnect />}
            {activeApp === 'flow' && <KaraFlow />}

            {false && (
              <div className="flex w-full h-full bg-white">
                <div className="w-64 border-r border-slate-200 bg-slate-50 flex flex-col">
                  <div className="p-3 border-b border-slate-200">
                    <button onClick={addNote} className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-yellow-500 text-white rounded-lg text-sm font-medium hover:bg-yellow-600 transition"><Plus size={16}/> New Note</button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-2 space-y-1">
                    {notes.map(note => (
                      <button key={note.id} onClick={() => setActiveNoteId(note.id)} className={`w-full text-left p-3 rounded-lg transition ${activeNoteId === note.id ? 'bg-white shadow-sm border border-slate-200' : 'hover:bg-slate-100'}`}>
                        <p className={`text-sm font-medium truncate ${activeNoteId === note.id ? 'text-slate-900' : 'text-slate-700'}`}>{note.title || 'Untitled'}</p>
                        <p className="text-xs text-slate-500 truncate mt-1">{note.content || 'No additional text'}</p>
                      </button>
                    ))}
                  </div>
                </div>
                <div className="flex-1 p-8 overflow-y-auto">
                  {activeNote ? (
                    <div className="max-w-3xl mx-auto">
                      <input value={activeNote.title} onChange={(e) => updateNote('title', e.target.value)} className="w-full text-3xl font-bold text-slate-900 border-none focus:outline-none bg-transparent mb-4 placeholder-slate-300" placeholder="Note Title" />
                      <textarea value={activeNote.content} onChange={(e) => updateNote('content', e.target.value)} className="w-full h-[calc(100vh-250px)] text-lg text-slate-700 border-none focus:outline-none bg-transparent resize-none placeholder-slate-300 leading-relaxed" placeholder="Start typing..." />
                    </div>
                  ) : (<div className="flex items-center justify-center h-full text-slate-400">Select a note.</div>)}
                </div>
              </div>
            )}

            {activeApp === 'sheets' && <KaraSheets />}
            {activeApp === 'slides' && <KaraSlides seekReport={aiResponse} />}
            {!['dashboard', 'word', 'notes', 'sheets', 'slides', 'pdf', 'mail', 'base', 'sync', 'calendar', 'flow', 'connect', 'design', 'drive', 'seek'].includes(activeApp) && (
              <div className="w-full h-full flex items-center justify-center text-slate-400">
                <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200 text-center max-w-md">
                  <h2 className="text-xl font-semibold text-slate-800 mb-2">{suiteApps.find(a => a.id === activeApp)?.name} Engine Loading...</h2>
                </div>
              </div>
            )}
          </div>

          {showIntel && (<KaraIntelligence onClose={() => setShowIntel(false)} onToWord={(t) => { const html = t.split('\n').map(l => '<p>' + l + '</p>').join(''); localStorage.setItem('karaWordDoc', html); setActiveApp('word'); setTimeout(() => window.dispatchEvent(new CustomEvent('kara-word-load', { detail: html })), 400); }} onToSlides={(t) => { setActiveApp('slides'); setTimeout(() => window.dispatchEvent(new CustomEvent('kara-intel-slides', { detail: t })), 400); }} />)}
          {activeApp !== 'dashboard' && aiMode !== 'off' && (
            <div className="w-80 bg-white border-l border-slate-200 flex flex-col shadow-lg flex-shrink-0 z-10">
              <div className="p-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
                  {aiMode === 'seek' ? <Bot size={16} className="text-purple-500"/> : aiMode === 'cloud' ? <Sparkles size={16} className="text-blue-500"/> : <Shield size={16} className="text-emerald-500"/>}
                  {aiMode === 'seek' ? 'Kara Seek (On-Prem Agent)' : aiMode === 'cloud' ? 'Kara Cloud (Standard AI)' : 'Kara Local (Offline Text)'}
                </div>
              </div>
              <div className="flex-1 p-4 overflow-y-auto">
                {aiMode === 'seek' && agentLogs.length > 0 && (
                  <div className="mb-4 space-y-2">
                    {agentLogs.map((log, idx) => (
                      <div key={idx} className="flex items-start gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                        <Terminal size={12} className="mt-0.5 text-purple-500 flex-shrink-0" /><span>{log}</span>
                      </div>
                    ))}
                  </div>
                )}
                {aiResponse && <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-700 whitespace-pre-wrap">{aiResponse}</div>}
                {!aiResponse && !isThinking && <div className="text-center text-xs text-slate-400 mt-10">Ask me anything.</div>}
                {isThinking && <div className="flex items-center gap-2 text-sm text-slate-500 mt-4"><Loader2 className="animate-spin" size={16} /> Thinking...</div>}
              </div>
              <div className="p-4 border-t border-slate-200">
                <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} onKeyDown={handleKeyDown} className="w-full h-20 bg-slate-50 border border-slate-200 rounded p-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none" placeholder="Type and press Enter..." />
                <button onClick={handleExecute} disabled={isThinking || !prompt.trim()} className="w-full mt-2 bg-slate-900 text-white text-sm py-2 rounded hover:bg-slate-800 transition flex items-center justify-center gap-2 disabled:opacity-50">
                  <Send size={14} /> Execute
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
export default App;


















