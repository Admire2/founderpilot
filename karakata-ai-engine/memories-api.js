require('dotenv').config(); const express = require('express'); const cors = require('cors'); const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json()); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
app.post('/api/v1/memories/upload', async (req, res) => {
  try { const { filename, type, gps_lat, gps_lon, tags } = req.body;
    const { data, error } = await supabase.from('media_memories').insert([{ filename, type, gps_lat, gps_lon, tags }]).select().single();
    if(error) throw error; res.status(201).json({ success: true, memory: data });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
const PORT = process.env.MEMORIES_PORT || 3046;
app.listen(PORT, () => console.log(`📸 KaraKata Memories (Immich) running on http://localhost:${PORT}`));
