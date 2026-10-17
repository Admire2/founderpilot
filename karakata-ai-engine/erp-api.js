require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/erp/account', async (req, res) => {
  try {
    const { name, type } = req.body;
    const { data, error } = await supabase.from('erp_accounts').insert([{ name, type }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, account: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/v1/erp/transaction', async (req, res) => {
  try {
    const { account_id, description, amount, type } = req.body;
    
    // 1. Record Transaction
    const { data: trans, error: tErr } = await supabase.from('erp_transactions').insert([{ account_id, description, amount, type }]).select().single();
    if (tErr) throw tErr;

    // 2. Update Account Balance (Simple Ledger Logic)
    const { data: acc } = await supabase.from('erp_accounts').select('balance').eq('id', account_id).single();
    const newBalance = Number(acc.balance) + Number(amount);
    await supabase.from('erp_accounts').update({ balance: newBalance }).eq('id', account_id);

    res.status(201).json({ success: true, transaction: trans, new_balance: newBalance });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.ERP_PORT || 3024;
app.listen(PORT, () => console.log(`💰 KaraKata ERP (ERPNext Killer) running on http://localhost:${PORT}`));
