export type HistoryEntry = {
  id: string;
  tool: string;
  title: string;
  savedAt: number;
  report: unknown;
};

const KEY = "founderpilot_history";

export function loadHistory(tool?: string): HistoryEntry[] {
  if (typeof window === "undefined") return [];

  try {
    const raw = window.localStorage.getItem(KEY);

    if (!raw) return [];

    const all = JSON.parse(raw) as HistoryEntry[];

    return tool ? all.filter((entry) => entry.tool === tool) : all;
  } catch {
    return [];
  }
}

export function saveReport(tool: string, title: string, report: unknown) {
  const entry: HistoryEntry = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    tool,
    title,
    savedAt: Date.now(),
    report,
  };

  const all = [entry, ...loadHistory()].slice(0, 30);

  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteReport(id: string) {
  const all = loadHistory().filter((entry) => entry.id !== id);

  window.localStorage.setItem(KEY, JSON.stringify(all));
}

export function clearHistory() {
  window.localStorage.removeItem(KEY);
}