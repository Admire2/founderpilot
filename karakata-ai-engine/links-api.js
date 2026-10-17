require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/links/create', async (req, res) => {
  try {
    const { slug, original_url } = req.body;
    // FIX: Capture the 'error' object so we can see if Supabase rejects it
    const { data, error } = await supabase.from('short_links').insert([{ slug, original_url }]).select().single();
    if (error) throw error; 
    res.status(201).json({ success: true, short_url: `https://kkta.co/${slug}`, link: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/links/click/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { data: link, error } = await supabase.from('short_links').select('*').eq('slug', slug).single();
    if (error || !link) return res.status(404).json({ error: 'Link not found' });
    
    await supabase.from('short_links').update({ clicks: link.clicks + 1 }).eq('slug', slug);
    res.json({ success: true, redirect_to: link.original_url, total_clicks: link.clicks + 1 });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.LINKS_PORT || 3021;
app.listen(PORT, () => console.log(`🔗 KaraKata Links API running on http://localhost:${PORT}`));
