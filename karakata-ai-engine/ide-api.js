require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/ide/workspace', async (req, res) => {
  try {
    const { name, language, code_content, owner } = req.body;
    const { data, error } = await supabase.from('ide_workspaces').insert([{ name, language, code_content, owner }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, workspace: data });
  } catch (e) { res.status(500).json({ success: false, error: e.message }); }
});

const PORT = process.env.IDE_PORT || 3043;
app.listen(PORT, () => console.log(`💻 KaraKata IDE (Theia Killer) running on http://localhost:${PORT}`));
