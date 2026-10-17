require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/search/index', async (req, res) => {
  try {
    const { title, content, metadata } = req.body;
    const { data, error } = await supabase.from('search_documents').insert([{ title, content, metadata }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, document: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/search/query', async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.status(400).json({ error: 'q is required' });
    // Uses Postgres native full-text search!
    const { data, error } = await supabase.from('search_documents').select('*').textSearch('search_vector', q);
    if (error) throw error;
    res.json({ success: true, results: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
const PORT = process.env.SEARCH_PORT || 3034;
app.listen(PORT, () => console.log(`🔍 KaraKata Search (Trieve Killer) running on http://localhost:${PORT}`));
