require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/builder/app', async (req, res) => {
  try {
    const { name, owner, ui_schema, data_sources } = req.body;
    const { data, error } = await supabase.from('builder_apps').insert([{ name, owner, ui_schema, data_sources }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, app: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
const PORT = process.env.BUILDER_PORT || 3032;
app.listen(PORT, () => console.log(`🛠️ KaraKata Builder (ToolJet Killer) running on http://localhost:${PORT}`));
