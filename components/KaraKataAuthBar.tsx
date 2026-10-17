"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function KaraKataAuthBar() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user } } = await sb.auth.getUser();
        setUser(user);
      } catch (error) {
        console.error("Auth error:", error);
      }
      setLoading(false);
    };
    getUser();

    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => {
    await sb.auth.signOut();
    setUser(null);
    router.refresh();
    window.location.href = '/karakata';
  };

  if (loading) {
    return <div className="h-6 w-24 bg-slate-700 animate-pulse rounded"></div>;
  }

  if (!user) {
    return (
      <Link href="/auth" className="flex flex-col items-end hover:text-amber-300 transition">
        <span className="text-[10px] text-slate-300">Hello, sign in</span>
        <span className="text-sm font-bold text-white">Account & Lists</span>
      </Link>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <span className="text-[10px] text-slate-300">Hello, {user.email?.split('@')[0] || 'User'}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-bold text-amber-400 truncate max-w-[150px]" title={user.email}>
          {user.email}
        </span>
        <button
          onClick={handleLogout}
          className="text-[10px] font-bold text-slate-300 hover:text-white border border-slate-600 hover:border-amber-400 px-2 py-0.5 rounded transition"
        >
          Logout
        </button>
      </div>
    </div>
  );
}
