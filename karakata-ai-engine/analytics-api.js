require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 1. INGEST EVENT (High-speed logging)
app.post('/api/v1/analytics/track', async (req, res) => {
  try {
    const { event_name, user_id, session_id, properties } = req.body;
    if (!event_name) return res.status(400).json({ error: 'event_name is required' });

    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;

    const { error } = await supabase.from('event_logs').insert([{
      event_name,
      user_id,
      session_id,
      properties,
      ip_address: ip
    }]);

    if (error) throw error;
    res.status(200).json({ success: true, message: 'Event logged' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET METRICS (Simple dashboard data)
app.get('/api/v1/analytics/stats/:eventName', async (req, res) => {
  try {
    const { eventName } = req.params;
    const { count, error } = await supabase
      .from('event_logs')
      .select('*', { count: 'exact', head: true })
      .eq('event_name', eventName);

    if (error) throw error;
    res.json({ success: true, event: eventName, total_count: count });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.ANALYTICS_PORT || 3007;
app.listen(PORT, () => {
  console.log(`📊 Product Analytics Engine running on http://localhost:${PORT}`);
});
