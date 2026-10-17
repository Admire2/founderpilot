require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/social/schedule', async (req, res) => {
  try {
    const { platform, content, scheduled_for } = req.body;
    const { data } = await supabase.from('social_posts').insert([{ platform, content, scheduled_for, status: 'scheduled' }]).select().single();
    res.status(201).json({ success: true, post: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.SOCIAL_PORT || 3020;
app.listen(PORT, () => console.log(`📱 KaraKata Social API running on http://localhost:${PORT}`));
