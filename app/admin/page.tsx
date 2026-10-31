"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";

const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

export default function AdminPage() {
  const [step, setStep] = useState<"login" | "2fa" | "dashboard">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [mfaFactorId, setMfaFactorId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const [activeTab, setActiveTab] = useState<"credits" | "disputes" | "audit">("credits");
  
  // Credits
  const [creditsEmail, setCreditsEmail] = useState("");
  const [creditsAmount, setCreditsAmount] = useState("");
  const [creditsReason, setCreditsReason] = useState("");
  const [creditsMsg, setCreditsMsg] = useState("");
  
  // Disputes
  const [disputes, setDisputes] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any>(null);
  const [loadingDisputes, setLoadingDisputes] = useState(false);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [action, setAction] = useState<"release_to_seller" | "refund_buyer" | null>(null);
  const [adminNote, setAdminNote] = useState("");
  const [resolving, setResolving] = useState(false);
  const [disputeMsg, setDisputeMsg] = useState("");

  // Audit Log
  const [auditLogs, setAuditLogs] = useState<any[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const { data: { session } } = await sb.auth.getSession();
      if (session?.user) {
        const { data: profile } = await sb.from("profiles").select("role").eq("id", session.user.id).single();
        if (profile?.role === "admin") {
          setStep("dashboard");
          fetchDisputes();
        }
      }
    };
    checkSession();
  }, []);

  const handleLogin = async () => {
    setLoading(true); setErrorMsg("");
    try {
      const { data, error } = await sb.auth.signInWithPassword({ email, password });
      if (error) {
        if (error.message.toLowerCase().includes("mfa") || error.name === "AuthMFARequiredError") {
          setStep("2fa");
          const { data: factorsData } = await sb.auth.mfa.listFactors();
          const totpFactor = factorsData?.factors?.find((f: any) => f.factor_type === "totp" && f.status === "verified");
          if (totpFactor) setMfaFactorId(totpFactor.id);
          else { setErrorMsg("2FA not set up. Contact super admin."); setStep("login"); }
        } else { setErrorMsg(error.message); }
      } else {
        const { data: factorsData } = await sb.auth.mfa.listFactors();
        const totpFactor = factorsData?.factors?.find((f: any) => f.factor_type === "totp" && f.status === "verified");
        if (totpFactor) { setStep("2fa"); setMfaFactorId(totpFactor.id); }
        else {
          const { data: profile } = await sb.from("profiles").select("role").eq("id", data.user?.id).single();
          if (profile?.role !== "admin") { await sb.auth.signOut(); setErrorMsg("Access denied: Admin privileges required."); setStep("login"); }
          else { setStep("dashboard"); fetchDisputes(); }
        }
      }
    } catch (err) { setErrorMsg("An unexpected error occurred."); }
    setLoading(false);
  };

  const handle2FAVerify = async () => {
    if (mfaCode.length !== 6) { setErrorMsg("Please enter a valid 6-digit code."); return; }
    setLoading(true); setErrorMsg("");
    try {
      const { data: challengeData, error: challengeError } = await sb.auth.mfa.challenge({ factorId: mfaFactorId });
      if (challengeError) throw challengeError;
      const { error: verifyError } = await sb.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challengeData.id, code: mfaCode });
      if (verifyError) { setErrorMsg("Invalid 2FA code."); setMfaCode(""); }
      else {
        const { data: { user } } = await sb.auth.getUser();
        const { data: profile } = await sb.from("profiles").select("role").eq("id", user?.id).single();
        if (profile?.role !== "admin") { await sb.auth.signOut(); setErrorMsg("Access denied."); setStep("login"); }
        else { setStep("dashboard"); fetchDisputes(); }
      }
    } catch (err: any) { setErrorMsg(err.message || "2FA verification failed."); }
    setLoading(false);
  };

  const handleLogout = async () => { await sb.auth.signOut(); setStep("login"); setEmail(""); setPassword(""); setMfaCode(""); };

  const handleGrant = async () => {
    setCreditsMsg("Processing...");
    try {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch("/api/admin/credits", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` }, body: JSON.stringify({ email: creditsEmail, amount: Number(creditsAmount), reason: creditsReason }) });
      const j = await r.json();
      setCreditsMsg(j.ok ? `✅ Granted ${creditsAmount} credits` : `❌ ${j.error}`);
      if (j.ok) { setCreditsEmail(""); setCreditsAmount(""); setCreditsReason(""); }
    } catch (e) { setCreditsMsg("❌ Network error"); }
  };

  const fetchDisputes = async () => {
    setLoadingDisputes(true);
    try {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch("/api/admin/disputes", { headers: { "Authorization": `Bearer ${session?.access_token}` } });
      const j = await r.json();
      if (j.ok) { setDisputes(j.disputes); setMetrics(j.metrics); }
    } catch (e) { console.error("Failed to fetch disputes", e); }
    setLoadingDisputes(false);
  };

  const handleResolve = async () => {
    if (!selectedDispute || !action) return;
    if (!confirm(`⚠️ CONFIRM: ${action === "refund_buyer" ? "REFUND BUYER" : "RELEASE TO SELLER"} for order #${selectedDispute.id}?`)) return;
    setResolving(true); setDisputeMsg("");
    try {
      const { data: { session } } = await sb.auth.getSession();
      const r = await fetch("/api/admin/disputes/resolve", { method: "POST", headers: { "Content-Type": "application/json", "Authorization": `Bearer ${session?.access_token}` }, body: JSON.stringify({ order_id: selectedDispute.id, action, admin_note: adminNote }) });
      const j = await r.json();
      if (j.ok) { setDisputeMsg(`✅ Success!`); setSelectedDispute(null); setAction(null); setAdminNote(""); fetchDisputes(); }
      else { setDisputeMsg(`❌ ${j.error}`); }
    } catch (e) { setDisputeMsg("❌ Network error"); }
    setResolving(false);
  };

  const fetchAuditLogs = async () => {
    setLoadingAudit(true);
    try {
      const { data, error } = await sb.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(100);
      if (error) throw error;
      setAuditLogs(data || []);
    } catch (e) { console.error("Failed to fetch audit logs", e); }
    setLoadingAudit(false);
  };

  if (step === "login") {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl">
          <h1 className="text-2xl font-bold text-amber-400 mb-2">🔐 KaraKata Admin</h1>
          <p className="text-sm text-slate-400 mb-6">Secure login required</p>
          <div className="space-y-4">
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Admin Email" className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-amber-400 focus:outline-none" />
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleLogin()} placeholder="Password" className="w-full rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-amber-400 focus:outline-none" />
            {errorMsg && <p className="text-sm font-bold text-rose-400">{errorMsg}</p>}
            <button onClick={handleLogin} disabled={loading} className="w-full bg-amber-500 text-slate-900 py-3 rounded-lg font-bold hover:bg-amber-400 transition disabled:opacity-50">{loading ? "Verifying..." : "Access Dashboard →"}</button>
          </div>
        </div>
      </main>
    );
  }

  if (step === "2fa") {
    return (
      <main className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
        <div className="bg-slate-800 rounded-2xl p-8 max-w-md w-full border border-slate-700 shadow-2xl text-center">
          <div className="w-16 h-16 bg-amber-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Two-Factor Authentication</h1>
          <p className="text-sm text-slate-400 mb-6">Enter the 6-digit code from your Authenticator app.</p>
          <div className="space-y-4">
            <input type="text" inputMode="numeric" pattern="[0-9]*" maxLength={6} value={mfaCode} onChange={(e) => setMfaCode(e.target.value.replace(/\D/g, ""))} onKeyDown={(e) => e.key === "Enter" && handle2FAVerify()} placeholder="000000" className="w-full text-center text-3xl tracking-widest rounded-lg border border-slate-600 bg-slate-900 px-4 py-3 text-white focus:border-amber-400 focus:outline-none" />
            {errorMsg && <p className="text-sm font-bold text-rose-400">{errorMsg}</p>}
            <button onClick={handle2FAVerify} disabled={loading || mfaCode.length !== 6} className="w-full bg-amber-500 text-slate-900 py-3 rounded-lg font-bold hover:bg-amber-400 transition disabled:opacity-50">{loading ? "Verifying..." : "Verify & Access"}</button>
            <button onClick={() => { setStep("login"); setMfaCode(""); setErrorMsg(""); }} className="text-sm text-slate-400 hover:text-white transition">← Back to Password</button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div><h1 className="text-3xl font-bold text-slate-900">🛡️ Admin Command Center</h1><p className="text-sm text-slate-600 mt-1">Secured with JWT • Platform oversight active</p></div>
          <button onClick={handleLogout} className="text-sm font-bold text-rose-600 hover:text-rose-800 bg-rose-50 px-4 py-2 rounded-lg">Logout</button>
        </div>

        <div className="flex gap-2 mb-6 border-b border-slate-200">
          <button onClick={() => setActiveTab("credits")} className={`px-6 py-3 font-bold text-sm transition ${activeTab === "credits" ? "border-b-2 border-amber-500 text-amber-600" : "text-slate-500 hover:text-slate-700"}`}>💳 Credits</button>
          <button onClick={() => { setActiveTab("disputes"); if (disputes.length === 0) fetchDisputes(); }} className={`px-6 py-3 font-bold text-sm transition ${activeTab === "disputes" ? "border-b-2 border-rose-500 text-rose-600" : "text-slate-500 hover:text-slate-700"}`}>⚖️ Disputes</button>
          <button onClick={() => { setActiveTab("audit"); if (auditLogs.length === 0) fetchAuditLogs(); }} className={`px-6 py-3 font-bold text-sm transition ${activeTab === "audit" ? "border-b-2 border-slate-800 text-slate-800" : "text-slate-500 hover:text-slate-700"}`}>📜 Audit Log</button>
        </div>

        {activeTab === "credits" && (
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 max-w-2xl">
            <h2 className="text-xl font-bold text-slate-900 mb-4">Grant Credits</h2>
            <div className="space-y-4">
              <div><label className="text-xs font-bold text-slate-600 mb-1 block">User Email</label><input type="email" value={creditsEmail} onChange={(e) => setCreditsEmail(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" placeholder="user@example.com" /></div>
              <div><label className="text-xs font-bold text-slate-600 mb-1 block">Amount</label><input type="number" value={creditsAmount} onChange={(e) => setCreditsAmount(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" placeholder="50" /></div>
              <div><label className="text-xs font-bold text-slate-600 mb-1 block">Reason</label><input type="text" value={creditsReason} onChange={(e) => setCreditsReason(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" placeholder="e.g., Apology for downtime" /></div>
              <button onClick={handleGrant} className="w-full bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 transition">Grant Credits</button>
              {creditsMsg && <p className="text-sm font-bold text-center text-emerald-700">{creditsMsg}</p>}
            </div>
          </div>
        )}

        {activeTab === "disputes" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Open Disputes</h2>
              <button onClick={fetchDisputes} disabled={loadingDisputes} className="bg-emerald-600 text-white px-4 py-2 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50 text-sm">{loadingDisputes ? "Refreshing..." : "🔄 Refresh"}</button>
            </div>
            {metrics && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500 uppercase">Total</p><p className="text-3xl font-bold text-rose-600 mt-1">{metrics.totalDisputes}</p></div>
                <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500 uppercase">Open</p><p className="text-3xl font-bold text-orange-600 mt-1">{metrics.openDisputes}</p></div>
                <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500 uppercase">Total Escrow</p><p className="text-3xl font-bold text-emerald-600 mt-1">${metrics.totalEscrowHeld.toFixed(2)}</p></div>
                <div className="bg-white rounded-xl border border-slate-200 p-4"><p className="text-xs font-bold text-slate-500 uppercase">Disputed</p><p className="text-3xl font-bold text-rose-600 mt-1">${metrics.disputeEscrowHeld.toFixed(2)}</p></div>
              </div>
            )}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Order</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Buyer</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Seller</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Amount</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {disputes.length === 0 ? (<tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No open disputes 🎉</td></tr>) : (
                    disputes.map((d) => (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 font-mono text-xs">{String(d.id).slice(0, 8)}...</td>
                        <td className="px-4 py-3 text-xs">{d.buyer_email || "Guest"}</td>
                        <td className="px-4 py-3 text-xs font-bold">{d.seller?.shop_name || "Unknown"}</td>
                        <td className="px-4 py-3 font-bold text-emerald-700">${Number(d.total_amount).toFixed(2)}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${d.status === "dispute_open" ? "bg-orange-100 text-orange-800" : "bg-amber-100 text-amber-800"}`}>{d.status === "dispute_open" ? "⚠️ Open" : "📋 Review"}</span></td>
                        <td className="px-4 py-3"><button onClick={() => setSelectedDispute(d)} className="text-xs font-bold text-emerald-700 hover:text-emerald-900">Review →</button></td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {selectedDispute && (
              <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
                <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto p-6">
                  <div className="flex justify-between items-start mb-4">
                    <h2 className="text-2xl font-bold text-slate-900">🛡️ Dispute Review</h2>
                    <button onClick={() => { setSelectedDispute(null); setAction(null); setDisputeMsg(""); }} className="text-slate-400 hover:text-slate-600 text-2xl">×</button>
                  </div>
                  <div className="bg-slate-50 rounded-lg p-4 mb-4 grid grid-cols-2 gap-3 text-sm">
                    <div><span className="font-bold text-slate-600">Order:</span> <span className="font-mono text-xs">{selectedDispute.id}</span></div>
                    <div><span className="font-bold text-slate-600">Amount:</span> <span className="font-bold text-emerald-700">${Number(selectedDispute.total_amount).toFixed(2)}</span></div>
                    <div><span className="font-bold text-slate-600">Buyer:</span> {selectedDispute.buyer_email}</div>
                    <div><span className="font-bold text-slate-600">Seller:</span> {selectedDispute.seller?.shop_name}</div>
                  </div>
                  <div className="mb-4">
                    <h3 className="font-bold text-rose-700 mb-2">📝 Buyer's Reason</h3>
                    <div className="bg-rose-50 border border-rose-200 rounded-lg p-3 text-sm text-rose-900 italic">"{selectedDispute.dispute_reason || "No reason provided"}"</div>
                  </div>
                  <div className="border-t border-slate-200 pt-4">
                    <h3 className="font-bold text-slate-900 mb-3">⚖️ Your Decision</h3>
                    <textarea value={adminNote} onChange={(e) => setAdminNote(e.target.value)} placeholder="Admin notes (required for audit trail)..." rows={3} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm mb-3 focus:border-amber-500 focus:outline-none" />
                    <div className="grid grid-cols-2 gap-3">
                      <button onClick={() => setAction("refund_buyer")} disabled={!adminNote.trim() || resolving} className="bg-rose-600 text-white py-3 rounded-lg font-bold hover:bg-rose-700 disabled:opacity-50">💸 Refund Buyer</button>
                      <button onClick={() => setAction("release_to_seller")} disabled={!adminNote.trim() || resolving} className="bg-emerald-600 text-white py-3 rounded-lg font-bold hover:bg-emerald-700 disabled:opacity-50">💰 Release to Seller</button>
                    </div>
                    {action && (
                      <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-sm font-bold text-amber-900 mb-2">⚠️ Confirm: {action === "refund_buyer" ? "REFUND BUYER" : "RELEASE TO SELLER"}</p>
                        <button onClick={handleResolve} disabled={resolving} className="w-full bg-slate-900 text-white py-2 rounded-lg font-bold hover:bg-slate-800 disabled:opacity-50">{resolving ? "Processing..." : `Confirm ${action === "refund_buyer" ? "Refund" : "Release"}`}</button>
                      </div>
                    )}
                    {disputeMsg && <p className={`mt-3 text-sm font-bold text-center ${disputeMsg.startsWith("✅") ? "text-emerald-700" : "text-rose-700"}`}>{disputeMsg}</p>}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === "audit" && (
          <div>
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-slate-900">Platform Audit Trail</h2>
              <button onClick={fetchAuditLogs} disabled={loadingAudit} className="bg-slate-800 text-white px-4 py-2 rounded-lg font-bold hover:bg-slate-700 disabled:opacity-50 text-sm">{loadingAudit ? "Refreshing..." : "🔄 Refresh Logs"}</button>
            </div>
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Timestamp</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Admin</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Action</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Target</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">Details</th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {auditLogs.length === 0 ? (<tr><td colSpan={6} className="px-4 py-12 text-center text-slate-500">No audit logs found yet.</td></tr>) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-slate-50">
                        <td className="px-4 py-3 text-xs text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs font-bold text-slate-700">{log.admin_email}</td>
                        <td className="px-4 py-3"><span className={`text-xs font-bold px-2 py-1 rounded-full ${log.action_type === "REFUND_BUYER" ? "bg-rose-100 text-rose-800" : log.action_type === "RELEASE_SELLER" ? "bg-emerald-100 text-emerald-800" : "bg-blue-100 text-blue-800"}`}>{log.action_type.replace("_", " ")}</span></td>
                        <td className="px-4 py-3 font-mono text-xs">{log.target_id}</td>
                        <td className="px-4 py-3 text-xs text-slate-600 max-w-xs truncate" title={JSON.stringify(log.details)}>{log.details?.reason || JSON.stringify(log.details)}</td>
                        <td className="px-4 py-3 text-xs font-mono text-slate-500">{log.ip_address || "N/A"}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
