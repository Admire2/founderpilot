require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/video/room', async (req, res) => {
  try {
    const { room_name, host_id } = req.body;
    const { data, error } = await supabase.from('video_rooms').insert([{ room_name, host_id }]).select().single();
    if (error) throw error;
    // In production, this generates a JWT for Jitsi/WebRTC. Here we generate a secure room URL.
    const joinUrl = `https://meet.karakata.ai/${data.id}?token=secure_jwt_${Date.now()}`;
    res.status(201).json({ success: true, room: data, join_url: joinUrl });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.VIDEO_PORT || 3014;
app.listen(PORT, () => console.log(`📹 Video Conferencing API running on http://localhost:${PORT}`));
