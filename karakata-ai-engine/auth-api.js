require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/auth/register', async (req, res) => {
  try {
    const { email, passkey_credential_id } = req.body;
    const { data, error } = await supabase.from('auth_users').insert([{ email, passkey_credential_id, is_verified: true }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, user: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.AUTH_PORT || 3028;
app.listen(PORT, () => console.log(`🔐 KaraKata Auth (Hanko Killer) running on http://localhost:${PORT}`));
