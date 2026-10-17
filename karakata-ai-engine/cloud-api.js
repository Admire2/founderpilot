require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/cloud/file', async (req, res) => {
  try {
    const { filename, file_url, size_bytes, owner_id } = req.body;
    const { data, error } = await supabase.from('cloud_files').insert([{ filename, file_url, size_bytes, owner_id }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, file: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.CLOUD_PORT || 3025;
app.listen(PORT, () => console.log(`☁️ KaraKata Cloud (Nextcloud Killer) running on http://localhost:${PORT}`));
