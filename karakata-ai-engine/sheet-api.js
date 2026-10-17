require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/sheet/view', async (req, res) => {
  try {
    const { table_name, view_name, config } = req.body;
    const { data, error } = await supabase.from('sheet_views').insert([{ table_name, view_name, config }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, view: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.SHEET_PORT || 3027;
app.listen(PORT, () => console.log(`📊 KaraKata Sheet (NocoDB Killer) running on http://localhost:${PORT}`));
