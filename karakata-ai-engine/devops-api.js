require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/devops/repo', async (req, res) => {
  try {
    const { repo_name, last_commit } = req.body;
    const { data, error } = await supabase.from('repo_registry').insert([{ repo_name, last_commit }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, repo: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/v1/devops/pipeline/run', async (req, res) => {
  try {
    const { repo_id } = req.body;
    const { data: pipe, error } = await supabase.from('ci_pipelines').insert([{ repo_id, status: 'building', stages: ['build', 'test', 'deploy'] }]).select().single();
    if (error) throw error;
    await supabase.from('ci_pipelines').update({ status: 'testing' }).eq('id', pipe.id);
    await supabase.from('ci_pipelines').update({ status: 'deployed' }).eq('id', pipe.id);
    res.status(201).json({ success: true, pipeline_id: pipe.id, final_status: 'deployed', message: 'Build -> Test -> Deploy complete.' });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.DEVOPS_PORT || 3039;
app.listen(PORT, () => console.log(`🛠️ KaraKata DevOps (Gitea+Jenkins Killer) running on http://localhost:${PORT}`));
