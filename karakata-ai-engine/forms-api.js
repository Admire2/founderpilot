require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/forms/submit', async (req, res) => {
  try {
    const { form_name, payload } = req.body;
    const { data } = await supabase.from('form_submissions').insert([{ form_name, payload }]).select().single();
    res.status(201).json({ success: true, submission: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.FORMS_PORT || 3022;
app.listen(PORT, () => console.log(`📝 KaraKata Forms API running on http://localhost:${PORT}`));
