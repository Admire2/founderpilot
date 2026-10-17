require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/billing/invoice', async (req, res) => {
  try {
    const { client_name, workspace_id, due_date, items } = req.body;
    const { data: inv, error: invErr } = await supabase.from('invoices').insert([{ client_name, workspace_id, due_date }]).select().single();
    if (invErr) throw invErr;
    
    let total = 0;
    const itemsToInsert = items.map(item => {
      const lineTotal = item.quantity * item.unit_price;
      total += lineTotal;
      return { invoice_id: inv.id, description: item.description, quantity: item.quantity, unit_price: item.unit_price };
    });

    await supabase.from('invoice_items').insert(itemsToInsert);
    await supabase.from('invoices').update({ total_amount: total }).eq('id', inv.id);
    
    res.status(201).json({ success: true, invoice: { ...inv, total_amount: total } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.BILLING_PORT || 3011;
app.listen(PORT, () => console.log(`💰 Billing API running on http://localhost:${PORT}`));
