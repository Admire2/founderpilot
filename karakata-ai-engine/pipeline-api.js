require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/pipeline/sync', async (req, res) => {
  try {
    const { source_name, destination_name } = req.body;
    const { data, error } = await supabase.from('data_syncs').insert([{ source_name, destination_name, status: 'running' }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, sync_job: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.PIPELINE_PORT || 3026;
app.listen(PORT, () => console.log(`🔄 KaraKata Pipeline (Airbyte Killer) running on http://localhost:${PORT}`));
