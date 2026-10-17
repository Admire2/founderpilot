"use client";

import { useEffect, useState } from "react";
import {
  HistoryEntry,
  loadHistory,
  deleteReport,
  clearHistory,
} from "@/lib/history";

type Props = {
  tool: string;
  refreshKey: number;
  onSelect: (entry: HistoryEntry) => void;
};

export default function HistoryPanel({ tool, refreshKey, onSelect }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setEntries(loadHistory(tool));
  }, [tool, refreshKey]);

  if (!entries.length) return null;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Saved Reports</h3>

        <button
          onClick={() => {
            clearHistory();
            setEntries([]);
          }}
          className="text-xs text-slate-400 transition hover:text-red-400"
        >
          Clear all
        </button>
      </div>

      <ul className="mt-4 space-y-2">
        {entries.map((entry) => (
          <li
            key={entry.id}
            className="flex items-center gap-3 rounded-xl border border-white/10 bg-slate-900/50 p-3"
          >
            <button
              onClick={() => onSelect(entry)}
              className="flex-1 min-w-0 text-left"
            >
              <p className="truncate text-sm text-slate-200 transition hover:text-cyan-400">
                {entry.title}
              </p>

              <p className="text-xs text-slate-500">
                {new Date(entry.savedAt).toLocaleString()}
              </p>
            </button>

            <button
              onClick={() => {
                deleteReport(entry.id);
                setEntries(loadHistory(tool));
              }}
              className="text-xs text-slate-500 transition hover:text-red-400"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}