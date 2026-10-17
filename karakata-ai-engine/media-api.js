require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/media/add', async (req, res) => {
  try {
    const { type, title, file_url, duration_or_pages, metadata } = req.body;
    const { data, error } = await supabase.from('media_library').insert([{ type, title, file_url, duration_or_pages, metadata }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, item: data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

app.get('/api/v1/media/list/:type', async (req, res) => {
  const { data } = await supabase.from('media_library').select('*').eq('type', req.params.type);
  res.json({ success: true, library: data });
});

const PORT = process.env.MEDIA_PORT || 3042;
app.listen(PORT, () => console.log(`🎬 KaraKata Media (Jellyfin/Calibre Killer) running on http://localhost:${PORT}`));
