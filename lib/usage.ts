import { useState, useEffect } from "react";
import { supabase } from "./supabase";

const FREE_LIMIT = 3;
const LOCAL_PREFIX = "founderpilot_usage_";

function localCount(tool: string): number {
  if (typeof window === "undefined") return 0;
  const raw = window.localStorage.getItem(LOCAL_PREFIX + tool);
  return raw ? parseInt(raw, 10) : 0;
}

export function useUsage(tool: string) {
  const [usage, setUsage] = useState(() => localCount(tool));
  const [isPro, setIsPro] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    async function load() {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (!token) {
        if (mounted) { setUsage(localCount(tool)); setLoading(false); }
        return;
      }
      try {
        const res = await fetch(`/api/usage?action=status&tool=${encodeURIComponent(tool)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token }),
        });
        const json = await res.json();
        if (mounted) {
          setUsage(json.count || 0);
          setIsPro(json.plan === "pro" || json.plan === "team" || !!json.team_id);
        }
      } catch {}
      if (mounted) setLoading(false);
    }
    load();
    return () => { mounted = false; };
  }, [tool]);

  const remaining = Math.max(0, FREE_LIMIT - usage);
  const locked = usage >= FREE_LIMIT && !isPro;

  async function recordUsage() {
    const { data } = await supabase.auth.getSession();
    const token = data.session?.access_token;
    if (token) {
      try {
        const res = await fetch(`/api/usage?action=record&tool=${encodeURIComponent(tool)}`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ access_token: token }),
        });
        const json = await res.json();
        setUsage(json.count || 0);
        setIsPro(json.plan === "pro" || json.plan === "team" || !!json.team_id);
        return;
      } catch {}
    }
    const next = localCount(tool) + 1;
    if (typeof window !== "undefined") window.localStorage.setItem(LOCAL_PREFIX + tool, String(next));
    setUsage(next);
  }

  return { usage, remaining, locked, isPro, loading, recordUsage };
}