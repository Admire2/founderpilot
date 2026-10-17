require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/cms/entry', async (req, res) => {
  try {
    const { content_type, slug, title, body } = req.body;
    const { data, error } = await supabase.from('cms_entries').insert([{ content_type, slug, title, body }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, entry: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/cms/:contentType', async (req, res) => {
  try {
    const { data, error } = await supabase.from('cms_entries').select('*').eq('content_type', req.params.contentType).eq('is_published', true);
    if (error) throw error;
    res.json({ success: true, entries: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.CMS_PORT || 3013;
app.listen(PORT, () => console.log(`📝 Headless CMS API running on http://localhost:${PORT}`));
