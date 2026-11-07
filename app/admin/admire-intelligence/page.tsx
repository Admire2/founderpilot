"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import Link from "next/link";

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// 🔒 THE VAULT: Only these emails can see the Admire Intelligence Dashboard
const AUTHORIZED_ADMIN_EMAILS = [
  "greatmind20@gmail.com", 
  "akandejoseph1@gmail.com" // Add your other top-level executive emails here
];

export default function AdmireIntelligencePage() {
  const router = useRouter();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await sb.auth.getSession();
      
      // 1. Check if user is logged in
      if (!session?.user?.email) {
        router.push("/auth?redirect=/admin/admire-intelligence");
        return;
      }

      // 2. Check if user's email is in the authorized list
      if (!AUTHORIZED_ADMIN_EMAILS.includes(session.user.email)) {
        alert("⛔ ACCESS DENIED: You do not have permission to view this classified dashboard.");
        router.push("/karakata"); // Kick them back to the public market
        return;
      }

      setIsAuthorized(true);

      // 3. If authorized, fetch the data
      const { data: pipelineData, error } = await sb
        .from("admire_pipeline")
        .select("*")
        .order("admire_score", { ascending: false });

      if (!error) {
        setData(pipelineData || []);
      }
      setLoading(false);
    };

    checkAuth();
  }, [router]);

  if (!isAuthorized || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="animate-pulse font-bold text-slate-600">Verifying Executive Access...</p>
      </div>
    );
  }

  // ... (Keep the rest of your beautiful UI code from the previous message here) ...
  // (I omitted it here to save space, just paste the UI part from the previous code block below this line)
