require('dotenv').config(); const express = require('express'); const cors = require('cors'); const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json()); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
app.post('/api/v1/tracks/ping', async (req, res) => {
  try { const { device_id, lat, lon, accuracy } = req.body;
    const { data, error } = await supabase.from('location_tracks').insert([{ device_id, lat, lon, accuracy }]).select().single();
    if(error) throw error; res.status(201).json({ success: true, ping: data });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
app.get('/api/v1/tracks/history/:deviceId', async (req, res) => {
  const { data } = await supabase.from('location_tracks').select('*').eq('device_id', req.params.deviceId).order('recorded_at', { ascending: false }).limit(50);
  res.json({ success: true, history: data });
});
const PORT = process.env.TRACKS_PORT || 3047;
app.listen(PORT, () => console.log(`📍 KaraKata Tracks (Dawarich/Connected Cities) running on http://localhost:${PORT}`));
