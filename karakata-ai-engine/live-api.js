require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/live/start', async (req, res) => {
  try {
    const { title } = req.body;
    const stream_key = 'live_' + crypto.randomBytes(12).toString('hex');
    const { data, error } = await supabase.from('live_streams').insert([{ title, stream_key, status: 'live' }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, stream: data, rtmp_url: 'rtmp://live.karakata.com/stream' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/v1/live/end', async (req, res) => {
  try {
    const { stream_id } = req.body;
    await supabase.from('live_streams').update({ status: 'ended' }).eq('id', stream_id);
    res.json({ success: true, message: 'Stream ended.' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.LIVE_PORT || 3040;
app.listen(PORT, () => console.log(`📺 KaraKata Live (Owncast Killer) running on http://localhost:${PORT}`));
