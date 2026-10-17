require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/docs/page', async (req, res) => {
  try {
    const { title, slug, content_markdown, is_public } = req.body;
    const { data } = await supabase.from('docs_pages').insert([{ title, slug, content_markdown, is_public }]).select().single();
    res.status(201).json({ success: true, page: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/docs/:slug', async (req, res) => {
  try {
    const { data } = await supabase.from('docs_pages').select('*').eq('slug', req.params.slug).single();
    if (!data) return res.status(404).json({ error: 'Page not found' });
    res.json({ success: true, page: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.DOCS_PORT || 3023;
app.listen(PORT, () => console.log(`📚 KaraKata Docs API running on http://localhost:${PORT}`));
