require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 1. TRIGGER A WORKFLOW
app.post('/api/v1/workflows/trigger', async (req, res) => {
  try {
    const { event_name, payload } = req.body;
    if (!event_name) return res.status(400).json({ error: 'event_name is required' });

    // Find active workflows listening to this event
    const { data: workflows, error } = await supabase
      .from('workflows')
      .select('*')
      .eq('trigger_event', event_name)
      .eq('is_active', true);

    if (error) throw error;
    if (!workflows || workflows.length === 0) {
      return res.json({ success: true, message: 'No active workflows for this event.', executed: 0 });
    }

    // Execute and log
    const executed = [];
    for (const wf of workflows) {
      console.log(`⚡ Executing Workflow: ${wf.name} | Action: ${wf.action_type}`);
      await supabase.from('workflow_logs').insert([{ workflow_id: wf.id, status: 'success', payload: payload }]);
      executed.push(wf.name);
    }

    res.json({ success: true, message: `Triggered ${executed.length} workflow(s).`, executed_workflows: executed });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. GET WORKFLOW LOGS
app.get('/api/v1/workflows/logs', async (req, res) => {
  try {
    const { data, error } = await supabase.from('workflow_logs').select('*, workflows(name)').order('created_at', { ascending: false }).limit(20);
    if (error) throw error;
    res.json({ success: true, logs: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.WORKFLOW_PORT || 3008;
app.listen(PORT, () => console.log(`⚡ Workflow Automation running on http://localhost:${PORT}`));
