"use client";
import { useEffect, useState } from "react";

export default function LifelineDashboard() {
  const [leads, setLeads] = useState<any[]>([]);

  // Mock data for now - in production, fetch from /api/karakata/kaws/lifeline/leads
  useEffect(() => {
    setLeads([
      { id: 1, name: "John Smith", address: "123 Peachtree St", status: "intake_pending", option: "short_sale", date: "2026-09-28" },
      { id: 2, name: "Jane Doe", address: "456 Oak Ave", status: "contacted", option: "loan_mod", date: "2026-09-27" }
    ]);
  }, []);

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-6">
      <header className="max-w-6xl mx-auto mb-8">
        <div className="text-sm font-bold tracking-widest text-emerald-400 uppercase mb-2">Kara Lifeline</div>
        <h1 className="text-4xl font-bold">Pre-Foreclosure Rescue Dashboard</h1>
        <p className="text-slate-400">Intervene early. Save credit. Capture exclusive leads.</p>
      </header>

      <div className="max-w-6xl mx-auto bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h2 className="text-xl font-bold mb-4">Active Rescue Leads</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-slate-400 uppercase bg-slate-800">
              <tr>
                <th className="px-4 py-3">Homeowner</th>
                <th className="px-4 py-3">Property</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Interest</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3">Action</th>
              </tr>
            </thead>
            <tbody>
              {leads.map((lead) => (
                <tr key={lead.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                  <td className="px-4 py-3 font-medium">{lead.name}</td>
                  <td className="px-4 py-3 text-slate-400">{lead.address}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded text-xs ${lead.status === 'intake_pending' ? 'bg-amber-900 text-amber-300' : 'bg-emerald-900 text-emerald-300'}`}>
                      {lead.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-300">{lead.option.replace('_', ' ')}</td>
                  <td className="px-4 py-3 text-slate-500">{lead.date}</td>
                  <td className="px-4 py-3">
                    <button className="text-indigo-400 hover:text-indigo-300">View Details</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}