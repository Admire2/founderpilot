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
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [registering, setRegistering] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { session } } = await sb.auth.getSession();
      const email = session?.user?.email || "";
      setSellerEmail(email);

      // Fetch all messages for this seller
      const { data, error } = await sb
        .from("kara_seller_messages")
        .select("*")
        .order("created_at", { ascending: false });

      if (data) {
        // Group messages into threads by thread_id
        const threadMap: Record<string, any[]> = {};
        data.forEach((msg: any) => {
          const tid = msg.thread_id || msg.id;
          if (!threadMap[tid]) threadMap[tid] = [];
          threadMap[tid].push(msg);
        });

        const threadList = Object.values(threadMap).map((msgs: any[]) => ({
          thread_id: msgs[0].thread_id || msgs[0].id,
          buyer_name: msgs[0].buyer_name,
          buyer_email: msgs[0].buyer_email,
          subject: msgs[0].subject,
          messages: msgs.sort((a: any, b: any) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()),
          last_message: msgs[msgs.length - 1],
          unread_count: msgs.filter((m: any) => m.status === "unread" && m.sender_type === "buyer").length,
          status: msgs[msgs.length - 1].status
        }));

        setThreads(threadList);
      }
      setLoading(false);
    };
    init();
  }, []);

  const handleReply = async () => {
    if (!reply.trim() || !selectedThread) return;
    setSending(true);

    const { error } = await sb.from("kara_seller_messages").insert({
      thread_id: selectedThread.thread_id,
      seller_id: null, // Will be linked via seller_email in production
      buyer_name: selectedThread.buyer_name,
      buyer_email: selectedThread.buyer_email,
      subject: selectedThread.subject,
      message: reply,
      sender_type: "seller",
      status: "replied"
    });

    if (!error) {
      // Mark all buyer messages in this thread as read
      await sb
        .from("kara_seller_messages")
        .update({ status: "read" })
        .eq("thread_id", selectedThread.thread_id)
        .eq("sender_type", "buyer");

      setReply("");
      // Refresh threads
      window.location.reload();
    } else {
      alert("Failed to send reply: " + error.message);
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

  return (
    <main className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Link href="/karakata/seller" className="text-sm font-bold text-emerald-700 hover:underline">Back to Seller Center</Link>
            <h1 className="mt-2 text-3xl font-bold">Buyer Messages</h1>
            <p className="text-sm text-slate-600">All communication stays on KaraKata. Never share personal contact info.</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-slate-500">Logged in as</p>
            <p className="font-bold">{sellerEmail || "Seller"}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Threads List */}
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

          {/* Message Thread */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {selectedThread ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <h2 className="font-bold text-slate-900">{selectedThread.subject}</h2>
                  <p className="text-xs text-slate-500">From: {selectedThread.buyer_name} (Buyer)</p>
                  <p className="text-[10px] text-amber-600 mt-1">Note: Buyer email is hidden for privacy. KaraKata will forward your reply.</p>
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
