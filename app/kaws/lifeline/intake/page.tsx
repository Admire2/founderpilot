"use client";
import { useState } from "react";

export default function LifelineIntakePage() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const res = await fetch("/api/karakata/kaws/lifeline/intake", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(Object.fromEntries(formData))
    });
    
    if (res.ok) setSuccess(true);
    setLoading(false);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg text-center border-t-4 border-emerald-500">
          <div className="text-5xl mb-4">🤝</div>
          <h1 className="text-2xl font-bold text-slate-800 mb-2">Information Received</h1>
          <p className="text-slate-600">Thank you for reaching out. A licensed specialist from our team will review your details and call you within 2 hours to discuss your options.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-lg border-t-4 border-indigo-600">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-800">Homeowner Relief Intake</h1>
          <p className="text-sm text-slate-500 mt-2">Secure, confidential, and no obligation.</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Full Name</label>
            <input required name="homeowner_name" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Property Address</label>
            <input required name="property_address" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Phone Number</label>
              <input required name="contact_phone" type="tel" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-600 mb-1">Email</label>
              <input required name="contact_email" type="email" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Which option interests you most?</label>
            <select name="chosen_option" className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none">
              <option value="loan_mod">Loan Modification / Forbearance</option>
              <option value="short_sale">Short Sale</option>
              <option value="deed_lieu">Deed in Lieu of Foreclosure</option>
              <option value="cash_sale">Quick Cash Sale</option>
              <option value="unsure">I'm not sure yet</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Additional Notes (Optional)</label>
            <textarea name="notes" rows={3} className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none"></textarea>
          </div>
          <button disabled={loading} className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-lg transition disabled:opacity-50">
            {loading ? "Submitting Securely..." : "Submit for Specialist Review"}
          </button>
        </form>
      </div>
    </main>
  );
}