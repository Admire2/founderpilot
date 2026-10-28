"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function SellerMessages() {
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
      .select("id, thread_id, buyer_id, buyer_name, subject, sender_type, message, status, created_at")
      .order("created_at", { ascending: false });

    if (data) {
      const threadMap: Record<string, any[]> = {};
      data.forEach((msg: any) => {
        const tid = msg.thread_id || msg.id;
        if (!threadMap[tid]) threadMap[tid] = [];
        threadMap[tid].push(msg);
      });

      const threadList = Object.values(threadMap).map((msgs: any[]) => ({
        thread_id: msgs[0].thread_id || msgs[0].id,
        buyer_id: msgs[0].buyer_id || null, // ✅ Keep it null if missing, don't use "Unknown ID" string
        buyer_name: msgs[0].buyer_name,
        subject: msgs[0].subject,
        messages: msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
        last_message: msgs[msgs.length - 1],
        unread_count: msgs.filter((m: any) => m.status === "unread" && m.sender_type === "buyer").length,
      }));
      setThreads(threadList);
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      const email = session?.user?.email || "";
      setSellerEmail(email);

      if (email) {
        const { data: sellerData } = await sb.from("sellers").select("id").eq("email", email).single();
        if (sellerData) setSellerId(sellerData.id);
      }

      await fetchThreads();
      setLoading(false);
    };
    init();
  }, []);

  const handleReply = async () => {
    if (!reply.trim() || !selectedThread || !sellerId) {
      if (!sellerId) alert("Seller profile not found. Please complete onboarding.");
      return;
    }

    // ✅ CRITICAL FIX: Prevent replying to legacy threads with missing buyer_id
    if (!selectedThread.buyer_id || selectedThread.buyer_id === "Unknown ID") {
      alert("⚠️ This is an old conversation thread with missing buyer data. For security and privacy, please ask the buyer to send a new message from their account so you can reply securely.");
      return;
    }

    setSending(true);

    const { error: insertError } = await sb.from("kara_seller_messages").insert({
      thread_id: selectedThread.thread_id,
      seller_id: sellerId,
      buyer_id: selectedThread.buyer_id, // ✅ Now guaranteed to be a valid UUID
      buyer_name: selectedThread.buyer_name,
      subject: selectedThread.subject,
      message: reply,
      sender_type: "seller",
      status: "read"
    });

    if (insertError) {
      alert("Failed to send reply: " + insertError.message);
      setSending(false);
      return;
    }

    await sb
      .from("kara_seller_messages")
      .update({ status: "read" })
      .eq("thread_id", selectedThread.thread_id)
      .eq("sender_type", "buyer");

    setReply("");
    await fetchThreads();
    
    const { data } = await sb
      .from("kara_seller_messages")
      .select("id, thread_id, buyer_id, buyer_name, subject, sender_type, message, status, created_at")
      .eq("thread_id", selectedThread.thread_id)
      .order("created_at", { ascending: true });
      
    if (data) {
      setSelectedThread({
        ...selectedThread,
        messages: data,
        last_message: data[data.length - 1],
        unread_count: 0
      });
    }

    setSending(false);
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50 p-6 flex items-center justify-center">
        <p className="text-slate-600">Loading messages...</p>
      </main>
    );
  }

  const shortenId = (id: string | null) => id ? `${id.slice(0, 8)}...${id.slice(-4)}` : "N/A (Legacy Thread)";

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/karakata/sellercenter/dashboard" className="text-sm font-bold text-emerald-700 hover:underline">← Back to Dashboard</Link>
            <h1 className="mt-2 text-3xl font-bold">Buyer Messages</h1>
            <p className="text-sm text-slate-600">All communication stays on KaraKata. Never share personal contact info.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Logged in as</p>
            <p className="font-bold">{sellerEmail || "Seller"}</p>
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
                  <button
                    key={thread.thread_id}
                    onClick={() => setSelectedThread(thread)}
                    className={`w-full text-left p-4 hover:bg-slate-50 transition ${selectedThread?.thread_id === thread.thread_id ? "bg-emerald-50 border-l-4 border-emerald-500" : ""}`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-bold text-sm text-slate-900 truncate">{thread.buyer_name}</p>
                      {thread.unread_count > 0 && (
                        <span className="bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{thread.unread_count}</span>
                      )}
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
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="font-bold text-slate-900">{selectedThread.subject}</h2>
                  <p className="text-xs text-slate-500">From: {selectedThread.buyer_name}</p>
                  <p className="text-[10px] text-slate-500 mt-1 font-mono">Buyer ID: {shortenId(selectedThread.buyer_id)}</p>
                  
                  {selectedThread.buyer_id && selectedThread.buyer_id !== "Unknown ID" ? (
                    <p className="text-[10px] text-amber-600 mt-2 font-bold bg-amber-50 p-2 rounded border border-amber-200">
                      🔒 Privacy Protected: Direct emails are hidden. Reference this Buyer ID for all grievance resolutions. Only KaraKata Admin can access contact details.
                    </p>
                  ) : (
                    <p className="text-[10px] text-rose-600 mt-2 font-bold bg-rose-50 p-2 rounded border border-rose-200">
                      ⚠️ Legacy Thread: This conversation was created before our new secure messaging system. Please ask the buyer to send a new message from their account to enable secure replies.
                    </p>
                  )}
                </div>

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
                  {selectedThread.buyer_id && selectedThread.buyer_id !== "Unknown ID" ? (
                    <>
                      <textarea
                        value={reply}
                        onChange={(e) => setReply(e.target.value)}
                        placeholder="Type your reply to the buyer..."
                        rows={3}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      />
                      <div className="flex justify-end gap-2 mt-2">
                        <button
                          onClick={() => setSelectedThread(null)}
                          className="px-4 py-2 rounded-lg border border-slate-300 text-sm font-bold text-slate-700 hover:bg-slate-50"
                        >
                          Close
                        </button>
                        <button
                          onClick={handleReply}
                          disabled={sending || !reply.trim()}
                          className="px-4 py-2 rounded-lg bg-emerald-600 text-sm font-bold text-white hover:bg-emerald-500 disabled:opacity-50"
                        >
                          {sending ? "Sending..." : "Send Reply"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="p-4 bg-slate-100 rounded-lg text-center">
                      <p className="text-sm font-bold text-slate-600">Replying is disabled for legacy threads.</p>
                      <p className="text-xs text-slate-500 mt-1">Please contact the buyer through the platform to start a new, secure conversation.</p>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="p-12 text-center text-slate-500">
                <p className="text-lg">Select a conversation to view messages</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
