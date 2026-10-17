require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/flags/create', async (req, res) => {
  try {
    const { flag_key, is_enabled, rollout_percentage } = req.body;
    const { data, error } = await supabase.from('feature_flags').insert([{ flag_key, is_enabled, rollout_percentage }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, flag: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/flags/check/:flagKey', async (req, res) => {
  try {
    const { flagKey } = req.params;
    const { data, error } = await supabase.from('feature_flags').select('*').eq('flag_key', flagKey).single();
    if (error || !data) return res.status(404).json({ error: 'Flag not found' });
    res.json({ success: true, flag: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.FLAGS_PORT || 3029;
app.listen(PORT, () => console.log(`🚩 KaraKata Flags (Flipt Killer) running on http://localhost:${PORT}`));
