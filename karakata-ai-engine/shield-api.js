require('dotenv').config(); const express = require('express'); const cors = require('cors'); const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json()); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
app.post('/api/v1/shield/block', async (req, res) => {
  try { const { domain, category } = req.body;
    const { data, error } = await supabase.from('shield_domains').insert([{ domain, category }]).select().single();
    if(error) throw error; res.status(201).json({ success: true, blocked: data });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/v1/shield/check/:domain', async (req, res) => {
  const { data } = await supabase.from('shield_domains').select('*').eq('domain', req.params.domain).single();
  res.json({ success: true, is_blocked: !!data, domain: req.params.domain });
});
const PORT = process.env.SHIELD_PORT || 3049;
app.listen(PORT, () => console.log(`🛡️ KaraKata Shield (Pi-hole) running on http://localhost:${PORT}`));
