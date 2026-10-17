require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/notify/send', async (req, res) => {
  try {
    const { channel, recipient, message } = req.body;
    // In production, this hooks into SendGrid/Twilio/Firebase. Here we log it.
    const { data } = await supabase.from('notification_logs').insert([{ channel, recipient, message }]).select().single();
    res.status(201).json({ success: true, log: data, message: `Dispatched via ${channel}` });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.NOTIFY_PORT || 3016;
app.listen(PORT, () => console.log(`🔔 KaraKata Notify API running on http://localhost:${PORT}`));
