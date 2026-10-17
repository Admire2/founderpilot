require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/remote/connect', async (req, res) => {
  try {
    const { target_host, protocol } = req.body;
    const access_token = 'rdp_' + crypto.randomBytes(16).toString('hex');
    const { data, error } = await supabase.from('remote_sessions').insert([{ target_host, protocol, access_token }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, session: data, connect_url: `wss://remote.karakata.com/${access_token}` });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

const PORT = process.env.REMOTE_PORT || 3044;
app.listen(PORT, () => console.log(`🖥️ KaraKata Remote (Guacamole Killer) running on http://localhost:${PORT}`));
