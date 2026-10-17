"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function GlobalHeader() {
  const [user, setUser] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [credits, setCredits] = useState(0); // Mocked for V1, can fetch from DB later
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await sb.auth.getUser();
      setUser(user);
      
      // TODO: Fetch real credits from database in V2
      if (user) setCredits(150); 
    };
    getUser();

    // Listen for auth changes (login/logout)
    const { data: { subscription } } = sb.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push('/karakata?q=' + encodeURIComponent(searchQuery));
    }
  };

  const handleLogout = async () => {
    await sb.auth.signOut();
    setUser(null);
    setCredits(0);
    router.refresh();
    window.location.href = '/';
  };

  return (
    <header className="w-full bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between gap-4 sticky top-0 z-40 shadow-sm">
      {/* Search Bar (KaraKata focused) */}
      <form onSubmit={handleSearch} className="flex flex-1 max-w-2xl">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search KaraKata products, services, or suites..."
          className="w-full rounded-l-lg border border-slate-300 bg-slate-50 px-4 py-2 text-sm text-slate-900 focus:outline-none focus:border-emerald-500"
        />
        <button type="submit" className="rounded-r-lg bg-amber-400 px-4 py-2 text-slate-900 hover:bg-amber-300 font-bold">
          ??
        </button>
      </form>

      {/* Right Side: Wallet & Auth */}
      <div className="flex items-center gap-6">
        {/* Wallet Balance */}
        <div className="hidden md:flex flex-col items-end">
          <span className="text-[10px] text-slate-500 font-bold uppercase">Wallet Balance</span>
          <span className="text-sm font-bold text-emerald-600">N {credits} Credits</span>
        </div>

        {/* Auth Section */}
        {user ? (
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-end">
              <span className="text-[10px] text-slate-500">Logged in as</span>
              <span className="text-sm font-bold text-slate-900 truncate max-w-[150px]">{user.email}</span>
            </div>
            <button
              onClick={handleLogout}
              className="rounded bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-700 transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <Link href="/auth" className="flex flex-col items-end hover:text-amber-600 transition">
            <span className="text-[10px] text-slate-500">Hello, sign in</span>
            <span className="text-sm font-bold text-slate-900">Account & Lists</span>
          </Link>
        )}
      </div>
    </header>
  );
}
