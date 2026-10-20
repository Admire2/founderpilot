"use client";
import { useState } from "react";

type Message = { role: "user" | "ai"; text: string; type?: "normal" | "waitlist"; productName?: string };

export default function FloatingAskWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([
    { role: "ai", text: "Hello! I'm Kara. Ask me anything about the KaraKata Marketplace, our Suites, or our services.", type: "normal" }
  ]);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [waitlistSubmitted, setWaitlistSubmitted] = useState(false);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", text: userMsg, type: "normal" }]);
    setLoading(true);

    try {
      const res = await fetch("/api/karakata/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg }),
      });
      const data = await res.json();
      
      // Check if the AI returned our special waitlist JSON
      if (data.response.startsWith("{") && data.response.includes("waitlist")) {
        try {
          const parsed = JSON.parse(data.response);
          setMessages((prev) => [...prev, { role: "ai", text: parsed.message, type: "waitlist", productName: parsed.productName }]);
        } catch {
          setMessages((prev) => [...prev, { role: "ai", text: data.response, type: "normal" }]);
        }
      } else {
        setMessages((prev) => [...prev, { role: "ai", text: data.response, type: "normal" }]);
      }
    } catch (err) {
      setMessages((prev) => [...prev, { role: "ai", text: "Sorry, I'm having trouble connecting right now.", type: "normal" }]);
    }
    setLoading(false);
  };

  const handleWaitlistSubmit = (productName: string) => {
    if (!email) return;
    // TODO: Phase 3 - Connect this to Supabase 'waitlist' table and trigger email
    console.log(`Waitlist: ${email} for ${productName}`);
    setWaitlistSubmitted(true);
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 flex items-center justify-center w-14 h-14 bg-cyan-500 text-white rounded-full shadow-lg hover:bg-cyan-400 transition-all hover:scale-110"
        title="Ask Kara for Help"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/>
        </svg>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 z-50 w-96 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl flex flex-col max-h-[500px]">
          {/* Header */}
          <div className="flex justify-between items-center p-4 border-b border-slate-800 bg-slate-800/50 rounded-t-xl">
            <h3 className="font-bold text-cyan-400 flex items-center gap-2">💬 Ask Kara</h3>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white text-lg">✕</button>
            <button onClick={() => setMessages([{ role: "ai", text: "Hello! I'm Kara. Ask me anything...", type: "normal" }])} className="text-xs text-cyan-400 hover:underline">Reset</button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.map((msg, idx) => (
              <div key={idx} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg p-3 text-sm ${msg.role === "user" ? "bg-cyan-600 text-white" : "bg-slate-800 text-slate-200 border border-slate-700"}`}>
                  {msg.text}
                  
                  {/* Waitlist UI */}
                  {msg.type === "waitlist" && !waitlistSubmitted && (
                    <div className="mt-3 pt-3 border-t border-slate-600">
                      <p className="text-xs text-slate-400 mb-2">Join the waitlist for: <span className="text-cyan-300 font-bold">{msg.productName}</span></p>
                      <input 
                        type="email" 
                        placeholder="your@email.com" 
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-600 rounded px-2 py-1.5 text-xs mb-2 text-white"
                      />
                      <button 
                        onClick={() => handleWaitlistSubmit(msg.productName || "Unknown")}
                        className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-1.5 rounded transition"
                      >
                        Notify Me & Generate Placeholder
                      </button>
                    </div>
                  )}
                  
                  {msg.type === "waitlist" && waitlistSubmitted && (
                    <div className="mt-3 pt-3 border-t border-slate-600 text-emerald-400 text-xs font-bold flex items-center gap-1">
                      ✓ You're on the list! We'll notify you.
                    </div>
                  )}
                </div>
              </div>
            ))}
            {loading && <div className="text-xs text-slate-500 italic">Kara is thinking...</div>}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-slate-800 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder="Ask about products, suites, or services..."
              className="flex-1 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-500"
              disabled={loading}
            />
            <button 
              onClick={sendMessage} 
              disabled={loading || !input.trim()}
              className="bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white px-3 py-2 rounded-lg transition"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
