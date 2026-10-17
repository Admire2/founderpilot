require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/deploy/start', async (req, res) => {
  try {
    const { service_name, version } = req.body;
    const { data, error } = await supabase.from('deployments').insert([{ service_name, version, status: 'building' }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, deployment: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.DEPLOY_PORT || 3031;
app.listen(PORT, () => console.log(`🚀 KaraKata Deploy (Coolify/Dokku Killer) running on http://localhost:${PORT}`));
