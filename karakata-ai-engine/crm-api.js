require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/crm/contact', async (req, res) => {
  try {
    const { email, name, tags } = req.body;
    const { data, error } = await supabase.from('crm_contacts').insert([{ email, name, tags }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, contact: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.CRM_PORT || 3012;
app.listen(PORT, () => console.log(`📧 CRM API running on http://localhost:${PORT}`));
