import { publishArtifact } from './intelligence';

type Rule = { id: string; triggerApp: string; triggerEvent: string; actionApp: string; actionType: string; active: boolean; condition?: string; schedule?: string };
const RULES_KEY = 'karaConnectRules';
const LOG_KEY = 'karaConnectLog';

const readRules = (): Rule[] => { try { return JSON.parse(localStorage.getItem(RULES_KEY) || '[]'); } catch { return []; } };
const log = (msg: string) => {
  try {
    const l = JSON.parse(localStorage.getItem(LOG_KEY) || '[]');
    l.unshift({ ts: Date.now(), msg });
    localStorage.setItem(LOG_KEY, JSON.stringify(l.slice(0, 40)));
    window.dispatchEvent(new CustomEvent('kara-connect-log'));
  } catch (e) {}
};
const today = () => new Date().toISOString().slice(0, 10);
const matches = (r: Rule, detail: any) => !r.condition || JSON.stringify(detail || {}).toLowerCase().includes(r.condition.toLowerCase());

const runAction = (rule: Rule, detail: any) => {
  const title = (detail && detail.title) || 'Automation item';
  if (rule.actionType === 'Create Event') {
    try {
      const ev = JSON.parse(localStorage.getItem('karaCalendarEvents') || '[]');
      ev.unshift({ id: 'auto' + Date.now().toString(36), title: '[Auto] ' + title, date: today(), time: '09:00', source: 'Kara Connect' });
      localStorage.setItem('karaCalendarEvents', JSON.stringify(ev));
    } catch (e) {}
  } else if (rule.actionType === 'Create Record') {
    try {
      const bases = JSON.parse(localStorage.getItem('karaBaseData') || '[]');
      if (bases.length) {
        const b = bases[0];
        const textCol = (b.cols || []).find((c: any) => c.type === 'text');
        b.rows = b.rows || [];
        b.rows.push({ id: 'auto' + Date.now().toString(36), cells: textCol ? { [textCol.id]: '[Auto] ' + title } : { c1: '[Auto] ' + title } });
        localStorage.setItem('karaBaseData', JSON.stringify(bases));
      }
    } catch (e) {}
  } else if (rule.actionType === 'Create Task') {
    try {
      const t = JSON.parse(localStorage.getItem('karaFlowTasks') || '[]');
      t.unshift({ id: 'auto' + Date.now().toString(36), title: '[Auto] ' + title, assignee: 'Kara Connect', status: 'todo', due: today() });
      localStorage.setItem('karaFlowTasks', JSON.stringify(t));
    } catch (e) {}
  } else if (rule.actionType === 'Publish Artifact') {
    publishArtifact('connect', 'Automation: ' + title, JSON.stringify(detail || {}));
  }
  log('FIRED: ' + rule.triggerApp + ' ' + rule.triggerEvent + ' -> ' + rule.actionType + ' (' + title + ')');
};

const triggerMap: Record<string, string> = {
  'Kara Base|Record Created': 'kara-base-record',
  'Kara Calendar|Event Scheduled': 'kara-calendar-event',
  'Kara Intelligence|Artifact Published': 'kara-intel-updated',
  'Kara Flow|Task Completed': 'kara-flow-task-done',
  'Kara Design|Design Exported': 'kara-design-export',
};

export function startConnectEngine() {
  if ((window as any).__karaEngineStarted) return;
  (window as any).__karaEngineStarted = true;

  Object.entries(triggerMap).forEach(([key, evt]) => {
    window.addEventListener(evt, (e: Event) => {
      const detail = (e as CustomEvent).detail || {};
      readRules().filter(r => r.active && (r.triggerApp + '|' + r.triggerEvent) === key && matches(r, detail)).forEach(r => runAction(r, detail));
    });
  });

  setInterval(() => {
    const day = new Date().toDateString();
    const last = localStorage.getItem('karaConnectLastDaily');
    if (last === day) return;
    const daily = readRules().filter(r => r.active && r.schedule === 'daily');
    if (daily.length) {
      daily.forEach(r => runAction(r, { title: 'Daily run ' + day }));
      localStorage.setItem('karaConnectLastDaily', day);
    }
  }, 60000);
}
