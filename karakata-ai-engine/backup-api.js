require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/backup/snapshot', async (req, res) => {
  try {
    const { table_name } = req.body;
    const { data, error } = await supabase.from(table_name).select('*').limit(1000);
    if (error) throw error;
    const { data: job } = await supabase.from('backup_jobs').insert([{ table_name, row_count: data.length, snapshot: data }]).select().single();
    res.status(201).json({ success: true, backup: { id: job.id, table_name, row_count: job.row_count, status: job.status } });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/backup/list', async (req, res) => {
  const { data } = await supabase.from('backup_jobs').select('id, table_name, row_count, status, created_at').order('created_at', { ascending: false });
  res.json({ success: true, backups: data });
});

const PORT = process.env.BACKUP_PORT || 3038;
app.listen(PORT, () => console.log(`💾 KaraKata Backup (Kopia Killer) running on http://localhost:${PORT}`));
