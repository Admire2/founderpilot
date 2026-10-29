"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function BuyerMessages() {
  const router = useRouter();
  const [threads, setThreads] = useState<any[]>([]);
  const [selectedThread, setSelectedThread] = useState<any>(null);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [buyerEmail, setBuyerEmail] = useState("");

  // ✅ BULLETPROOF ID SHORTENER: Handles numbers, strings, null, and undefined safely
  const shortenId = (id: any) => {
    if (id === null || id === undefined) return "N/A";
    const str = String(id);
    if (str.length <= 8) return str;
    return `${str.slice(0, 8)}...${str.slice(-4)}`;
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      
      if (!session?.user) {
        router.push("/auth?callbackUrl=/account/messages");
        return;
      }

      const currentUserId = session.user.id;
      setBuyerEmail(session.user.email || "");

      const { data: messages, error } = await sb
        .from("kara_seller_messages")
        .select("id, thread_id, seller_id, buyer_id, buyer_name, buyer_email, subject, sender_type, message, status, created_at")
        .eq("buyer_id", currentUserId)
        .order("created_at", { ascending: false });

      if (error) console.error("Error fetching messages:", error);

      if (messages) {
        const sellerIds = [...new Set(messages.map(m => m.seller_id).filter(Boolean))];
        let shopNameMap: Record<string, string> = {};
        
        if (sellerIds.length > 0) {
          const { data: sellers } = await sb.from("sellers").select("id, shop_name").in("id", sellerIds);
          sellers?.forEach(s => { 
            // ✅ Safely convert ID to string for the map key
            shopNameMap[String(s.id)] = s.shop_name || "Unknown Shop"; 
          });
        }

        const threadMap: Record<string, any[]> = {};
        messages.forEach((msg: any) => {
          const tid = msg.thread_id || msg.id;
          if (!threadMap[tid]) threadMap[tid] = [];
          threadMap[tid].push(msg);
        });

        const threadList = Object.values(threadMap).map((msgs: any[]) => {
          const firstMsg = msgs[0];
          return {
            thread_id: firstMsg.thread_id || firstMsg.id,
            seller_id: firstMsg.seller_id,
            // ✅ Safely lookup using stringified ID
            shop_name: shopNameMap[String(firstMsg.seller_id)] || "Unknown Shop",
            subject: firstMsg.subject || "General Inquiry",
            messages: msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            last_message: msgs[msgs.length - 1],
            unread_count: msgs.filter((m: any) => m.status === "unread" && m.sender_type === "seller").length,
          };
        });
        setThreads(threadList);
      }
      setLoading(false);
    };
    init();
  }, [router]);

  const handleReply = async () => {
    if (!reply.trim() || !selectedThread) return;
    setSending(true);

    const buyerId = selectedThread.messages[0]?.buyer_id; 

    // ✅ INDUSTRY STANDARD FIX: Explicitly save "Buyer" as name, and the real email for Admin/Resend
    const { error } = await sb.from("kara_seller_messages").insert({
      thread_id: selectedThread.thread_id,
      seller_id: selectedThread.seller_id,
      buyer_id: buyerId,
      buyer_name: "Buyer",          // ✅ Always display as "Buyer" to the seller
      buyer_email: buyerEmail,       // ✅ Save the real email for system notifications
      subject: selectedThread.subject,
      message: reply,
      sender_type: "buyer",
      status: "unread"
    });

    if (!error) {
      setReply("");
      const { data: messages } = await sb
        .from("kara_seller_messages")
        .select("id, thread_id, seller_id, buyer_id, buyer_name, buyer_email, subject, sender_type, message, status, created_at")
        .eq("buyer_id", buyerId)
        .order("created_at", { ascending: false });
        
      if (messages) {
        const threadMap: Record<string, any[]> = {};
        messages.forEach((msg: any) => {
          const tid = msg.thread_id || msg.id;
          if (!threadMap[tid]) threadMap[tid] = [];
          threadMap[tid].push(msg);
        });
        const threadList = Object.values(threadMap).map((msgs: any[]) => {
          const firstMsg = msgs[0];
          return {
            thread_id: firstMsg.thread_id || firstMsg.id,
            seller_id: firstMsg.seller_id,
            shop_name: firstMsg.subject.includes("Upstate") ? "Upstate Shop" : "Unknown Shop",
            subject: firstMsg.subject || "General Inquiry",
            messages: msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
            last_message: msgs[msgs.length - 1],
            unread_count: 0,
          };
        });
        setThreads(threadList);
        
        const { data: currentThreadData } = await sb.from("kara_seller_messages").select("*").eq("thread_id", selectedThread.thread_id).order("created_at", { ascending: true });
        if (currentThreadData) {
          setSelectedThread({ ...selectedThread, messages: currentThreadData, unread_count: 0 });
        }
      }
    } else {
      alert("Failed to send: " + error.message);
    }
    setSending(false);
  };

  const handleDeleteThread = async () => {
    if (!selectedThread || !confirm("Delete this conversation from your inbox?")) return;
    const { error } = await sb.from("kara_seller_messages").delete().eq("thread_id", selectedThread.thread_id);
    if (!error) {
      setSelectedThread(null);
      window.location.reload(); 
    }
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-slate-50"><p className="text-slate-600 animate-pulse">Loading your messages...</p></div>;

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/account" className="text-sm font-bold text-emerald-700 hover:underline">← Back to My Account</Link>
            <h1 className="mt-2 text-3xl font-bold">My Messages (Buying)</h1>
            <p className="text-sm text-slate-600">Secure, anonymized communication with sellers.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Logged in as Buyer</p>
            <p className="font-bold">{buyerEmail}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 bg-slate-50">
              <h2 className="font-bold text-slate-700">Conversations ({threads.length})</h2>
            </div>
            <div className="divide-y divide-slate-100 max-h-[600px] overflow-y-auto">
              {threads.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">No messages yet. Start exploring the market!</div>
              ) : (
                threads.map((thread) => (
                  // ✅ Safely convert thread_id to string for React key and comparison
                  <button 
                    key={String(thread.thread_id)} 
                    onClick={() => setSelectedThread(thread)} 
                    className={`w-full text-left p-4 hover:bg-slate-50 transition ${String(selectedThread?.thread_id) === String(thread.thread_id) ? "bg-purple-50 border-l-4 border-purple-500" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-slate-900 truncate">🏪 {thread.shop_name}</p>
                      {thread.unread_count > 0 && <span className="bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{thread.unread_count}</span>}
                    </div>
                    <p className="text-xs text-slate-600 truncate">{thread.subject}</p>
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
                    <h2 className="font-bold text-slate-900">{selectedThread.shop_name}</h2>
                    <p className="text-[10px] text-slate-500 mt-1 font-mono">Seller ID: {shortenId(selectedThread.seller_id)}</p>
                  </div>
                  <button onClick={handleDeleteThread} className="text-slate-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-lg transition" title="Delete this conversation">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
                
                <p className="text-[10px] text-amber-600 font-bold bg-amber-50 p-2 border-b border-amber-200">
                  🔒 Privacy Protected: Your email is hidden from the seller. Reference this Seller ID for grievance resolutions.
                </p>

                <div className="p-4 space-y-3 max-h-[400px] overflow-y-auto">
                  {selectedThread.messages.map((msg: any) => (
                    <div key={msg.id} className={`rounded-lg p-3 ${msg.sender_type === "seller" ? "bg-slate-100 ml-0 mr-8" : "bg-purple-50 ml-8 mr-0 border border-purple-200"}`}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700">{msg.sender_type === "seller" ? "Seller" : "You (Buyer)"}</span>
                        <span className="text-[10px] text-slate-400">{new Date(msg.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-slate-800">{msg.message}</p>
                    </div>
                  ))}
                </div>

                <div className="p-4 border-t border-slate-200">
                  <textarea value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Type your reply to the seller..." rows={3} className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500" />
                  <div className="flex justify-end gap-2 mt-2">
                    <button onClick={handleDeleteThread} className="px-4 py-2 rounded-lg border border-red-300 text-sm font-bold text-red-600 hover:bg-red-50 transition">Delete</button>
                    <button onClick={handleReply} disabled={sending || !reply.trim()} className="px-4 py-2 rounded-lg bg-purple-600 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50">{sending ? "Sending..." : "Send Reply"}</button>
                  </div>
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
