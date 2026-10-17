require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/localai/register', async (req, res) => {
  try {
    const { model_name, family, file_path } = req.body;
    const { data, error } = await supabase.from('local_models').insert([{ model_name, family, file_path }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, model: data, message: "Local model registered for inference." });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});
const PORT = process.env.LOCALAI_PORT || 3035;
app.listen(PORT, () => console.log(`🧠 KaraKata LocalAI (LLMWare Killer) running on http://localhost:${PORT}`));
