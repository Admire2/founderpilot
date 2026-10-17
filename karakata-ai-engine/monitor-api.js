require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/monitor/metric', async (req, res) => {
  try {
    const { service_name, metric_name, metric_value } = req.body;
    const { data, error } = await supabase.from('monitor_metrics').insert([{ service_name, metric_name, metric_value }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, metric: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.MONITOR_PORT || 3030;
app.listen(PORT, () => console.log(`📈 KaraKata Monitor (Prometheus Killer) running on http://localhost:${PORT}`));
