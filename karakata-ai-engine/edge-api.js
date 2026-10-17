require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/edge/deploy', async (req, res) => {
  try {
    const { name, runtime, code_text, trigger_type } = req.body;
    const { data, error } = await supabase.from('edge_functions').insert([{ name, runtime, code_text, trigger_type }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, function: data, message: "Deployed to edge network." });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
const PORT = process.env.EDGE_PORT || 3033;
app.listen(PORT, () => console.log(`⚡ KaraKata Edge (Taubyte Killer) running on http://localhost:${PORT}`));
