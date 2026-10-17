require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/translate/set', async (req, res) => {
  try {
    const { namespace, key, language, value } = req.body;
    const { data } = await supabase.from('translations').upsert([{ namespace, key, language, value }], { onConflict: 'namespace,key,language' }).select().single();
    res.status(201).json({ success: true, translation: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/translate/:namespace/:language', async (req, res) => {
  try {
    const { namespace, language } = req.params;
    const { data } = await supabase.from('translations').select('*').eq('namespace', namespace).eq('language', language);
    res.json({ success: true, translations: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.TRANSLATE_PORT || 3018;
app.listen(PORT, () => console.log(`🌍 KaraKata Translate API running on http://localhost:${PORT}`));
