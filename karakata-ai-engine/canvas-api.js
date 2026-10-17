require('dotenv').config(); const express = require('express'); const cors = require('cors'); const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json({ limit: '10mb' })); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
app.post('/api/v1/canvas/save', async (req, res) => {
  try { const { name, canvas_json, owner } = req.body;
    const { data, error } = await supabase.from('canvas_designs').insert([{ name, canvas_json, owner }]).select().single();
    if(error) throw error; res.status(201).json({ success: true, design: data });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
const PORT = process.env.CANVAS_PORT || 3050;
app.listen(PORT, () => console.log(`🎨 KaraKata Canvas (Canva) running on http://localhost:${PORT}`));
