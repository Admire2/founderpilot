"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation"; // ✅ Added router for redirection
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerMessages() {
  const router = useRouter(); // ✅ Initialize router
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerId, setSellerId] = useState<string | number | null>(null);

  const fetchThreads = async () => {
    const { data } = await sb
      .from("kara_seller_messages")
      .select("id, thread_id, buyer_id, buyer_name, buyer_email, subject, sender_type, message, status, created_at, seller_id")
      .order("created_at", { ascending: false });

    if (data) {
      const sellerIds = [...new Set(data.map(msg => msg.seller_id).filter(Boolean))];
      let shopNameMap: Record<string, string> = {};
      
      if (sellerIds.length > 0) {
        const { data: sellers } = await sb.from("sellers").select("id, shop_name").in("id", sellerIds);
        sellers?.forEach(s => { shopNameMap[s.id] = s.shop_name || "Unknown Shop"; });
      }

      const threadMap: Record<string, any[]> = {};
      data.forEach((msg: any) => {
        const tid = msg.thread_id || msg.id;
        if (!threadMap[tid]) threadMap[tid] = [];
        threadMap[tid].push(msg);
      });

      const threadList = Object.values(threadMap).map((msgs: any[]) => {
        const firstMsg = msgs[0];
        return {
          thread_id: firstMsg.thread_id || firstMsg.id,
          buyer_id: firstMsg.buyer_id || null,
          buyer_name: firstMsg.buyer_name,
          buyer_email: firstMsg.buyer_email,
          subject: firstMsg.subject,
          shop_name: shopNameMap[firstMsg.seller_id] || "My Store",
          messages: msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
          last_message: msgs[msgs.length - 1],
          unread_count: msgs.filter((m: any) => m.status === "unread" && m.sender_type === "buyer").length,
        };
      });
      setThreads(threadList);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      
      // ✅ ROLE GUARD: If not logged in, send to auth
      if (!session?.user) {
        router.push("/auth?callbackUrl=/account/messages");
        return;
      }

      const email = session.user.email;
      setSellerEmail(email);

      // ✅ ROLE GUARD: Check if this user is actually a seller
      const { data: sellerData } = await sb.from("sellers").select("id").eq("email", email).single();
      
      if (!sellerData) {
        // NOT A SELLER! Redirect immediately to the Buyer Message Center
        console.log("User is a buyer, redirecting to /account/messages");
        router.push("/account/messages");
        return;
      }
      
      // If we get here, they ARE a seller. Proceed as normal.
      setSellerId(sellerData.id);
      await fetchThreads();
      setLoading(false);
    };
    init();
  }, [router]);

  // ... (Keep the rest of the handleReply, handleDeleteThread, and JSX exactly as it was in the previous version) ...
  // For brevity, I am including the full component below so you can just copy-paste the whole thing.

  const handleReply = async () => {
    if (!reply.trim() || !selectedThread || !sellerId) {
      if (!sellerId) alert("Seller profile not found.");
      return;
    }
    if (!selectedThread.buyer_id) {
      alert("⚠️ This is a legacy thread with missing buyer data.");
      return;
    }
    setSending(true);
    const { error: insertError } = await sb.from("kara_seller_messages").insert({
      thread_id: selectedThread.thread_id, seller_id: sellerId, buyer_id: selectedThread.buyer_id,
      buyer_name: selectedThread.buyer_name, buyer_email: selectedThread.buyer_email,
      subject: selectedThread.subject, message: reply, sender_type: "seller", status: "read"
    });
    if (insertError) { alert("Failed to send reply: " + insertError.message); setSending(false); return; }
    await sb.from("kara_seller_messages").update({ status: "read" }).eq("thread_id", selectedThread.thread_id).eq("sender_type", "buyer");
    try {
      await fetch("/api/karakata/notify-buyer", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ buyer_id: selectedThread.buyer_id, seller_id: sellerId, thread_id: selectedThread.thread_id })
      });
    } catch (err) { console.warn("Notification trigger failed", err); }
    setReply("");
    await fetchThreads();
    const { data } = await sb.from("kara_seller_messages").select("id, thread_id, buyer_id, buyer_name, buyer_email, subject, sender_type, message, status, created_at, seller_id").eq("thread_id", selectedThread.thread_id).order("created_at", { ascending: true });
    if (data) setSelectedThread({ ...selectedThread, messages: data, last_message: data[data.length - 1], unread_count: 0 });
    setSending(false);
  };

  const handleDeleteThread = async () => {
    if (!selectedThread || !confirm("Delete this entire conversation?")) return;
    const { error } = await sb.from("kara_seller_messages").delete().eq("thread_id", selectedThread.thread_id);
    if (!error) { setSelectedThread(null); await fetchThreads(); } 
    else { alert("Failed to delete: " + error.message); }
  };

  if (loading) return <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center"><p className="text-slate-600 animate-pulse">Checking your account type...</p></main>;

  const shortenId = (id: string | null) => id ? `${id.slice(0, 8)}...${id.slice(-4)}` : "N/A";

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/karakata/sellercenter/dashboard" className="text-sm font-bold text-emerald-700 hover:underline">← Back to Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold">Seller Messages</h1>
            <p className="text-sm text-slate-600">All communication stays on KaraKata. Never share personal contact info.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Logged in as Seller</p>
            <p className="font-bold">{sellerEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-700">Conversations ({threads.length})</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No messages yet</div>
              ) : (
                threads.map((thread) => (
                  <button key={thread.thread_id} onClick={() => setSelectedThread(thread)} className={`w-full text-left p-4 hover:bg-slate-50 transition ${selectedThread?.thread_id === thread.thread_id ? "bg-emerald-50 border-l-4 border-emerald-500" : ""}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{thread.shop_name}</p>
                      {thread.unread_count > 0 && <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{thread.unread_count}</span>}
                    </div>
                    <p className="text-xs text-slate-600 truncate">From: {thread.buyer_name}</p>
                    <p className="text-xs text-purple-600 truncate font-medium mt-1">{thread.subject}</p>
                    <p className="text-[10px] text-slate-400 mt-1">{new Date(thread.last_message.created_at).toLocaleDateString()}</p>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {selectedThread ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-slate-50 flex justify-between items-start">
                  <div>
                    <h2 className="font-bold text-slate-900">{selectedThread.subject}</h2>
                    <p className="text-xs text-slate-500">From: {selectedThread.buyer_name}</p>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Buyer ID: {shortenId(selectedThread.buyer_id)}</p>
                  </div>
                  <button onClick={handleDeleteThread} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Delete this entire conversation">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                {selectedThread.buyer_id ? (
                  <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 border-b border-amber-200">🔒 Privacy Protected: Direct emails are hidden.</p>
                ) : (
                  <p className="text-[10px] text-rose-600 font-bold bg-rose-50 p-2 border-b border-rose-200">⚠️ Legacy Thread: Missing buyer data.</p>
                )}
                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {selectedThread.messages.map((msg: any) => (
                    <div key={msg.id} className={`rounded-lg p-3 ${msg.sender_type === "buyer" ? "bg-slate-100 ml-0 mr-8" : "bg-emerald-50 ml-8 mr-0 border border-emerald-200"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{msg.sender_type === "buyer" ? "Buyer" : "You (Seller)"}</span>
                        <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-800">{msg.message}</p>
                    </div>
                  ))}
                </div>
                <div className="p-4 border-t border-slate-200">
                  {selectedThread.buyer_id ? (
                    <>
                      <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply to the buyer..." rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                      <div className="flex justify-end gap-2 mt-2">
                        <button onClick={handleDeleteThread} className="px-4 py-2 rounded-lg border border-red-300 text-sm font-bold text-red-600 hover:bg-red-50 transition">Delete Thread</button>
                        <button onClick={handleReply} disabled={sending || !reply.trim()} className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50">{sending ? "Sending..." : "Send Reply"}</button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-slate-100 rounded-lg text-center"><p className="text-sm font-bold text-slate-600">Replying is disabled for legacy threads.</p></div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500"><p className="text-lg">Select a conversation to view messages</p></div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
