require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 1. CREATE A MEGA-PROJECT WORKSPACE
app.post('/api/v1/pm/workspace', async (req, res) => {
  try {
    const { name, client_name } = req.body;
    if (!name) return res.status(400).json({ error: 'Workspace name is required' });

    const { data, error } = await supabase.from('pm_workspaces').insert([{ name, client_name }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, workspace: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. ADD A PROJECT TO WORKSPACE
app.post('/api/v1/pm/project', async (req, res) => {
  try {
    const { workspace_id, name, start_date, end_date } = req.body;
    const { data, error } = await supabase.from('pm_projects').insert([{ workspace_id, name, start_date, end_date }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, project: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. ADD A TASK WITH DEPENDENCIES (Gantt Style)
app.post('/api/v1/pm/task', async (req, res) => {
  try {
    const { project_id, title, assignee, start_date, end_date, dependencies } = req.body;
    const { data, error } = await supabase.from('pm_tasks').insert([{ 
      project_id, title, assignee, start_date, end_date, dependencies: dependencies || [] 
    }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, task: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 4. GET FULL PROJECT HIERARCHY (For the Dashboard/Gantt Chart)
app.get('/api/v1/pm/hierarchy/:workspaceId', async (req, res) => {
  try {
    const { workspaceId } = req.params;
    
    const { data: projects, error: pErr } = await supabase
      .from('pm_projects')
      .select('*, pm_tasks(*)')
      .eq('workspace_id', workspaceId);
      
    if (pErr) throw pErr;
    res.json({ success: true, hierarchy: projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});


// ==========================================
// 🧠 KARA ENERGY AI UPGRADES (The Moat)
// ==========================================
const OpenAI = require('openai');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. PREDICTIVE RISK ENGINE
app.post('/api/v1/pm/ai/risk-analysis', async (req, res) => {
  try {
    const { workspaceId } = req.body;
    
    // Fetch the whole project tree
    const { data: projects } = await supabase
      .from('pm_projects')
      .select('*, pm_tasks(*)')
      .eq('workspace_id', workspaceId);

    const prompt = `You are an elite Construction & Engineering AI Project Manager. 
    Analyze this project hierarchy for risks, bottlenecks, and scheduling conflicts.
    
    Projects & Tasks: ${JSON.stringify(projects)}
    
    Respond ONLY in JSON:
    {
      "overall_risk_score": 0-100,
      "critical_bottlenecks": ["Insight 1", "Insight 2"],
      "ai_recommendations": ["Action 1", "Action 2"]
    }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    res.json({ success: true, risk_analysis: JSON.parse(response.choices[0].message.content) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. AUTO-PROCUREMENT (Marketplace Bridge)
app.post('/api/v1/pm/ai/procure', async (req, res) => {
  try {
    const { task_description } = req.body;
    
    const prompt = `You are an expert construction procurement AI. 
    Based on this task: "${task_description}"
    
    1. Estimate the materials needed.
    2. Generate a search query to find these materials on a B2B marketplace.
    
    Respond ONLY in JSON:
    {
      "materials_needed": ["Item 1 with quantity", "Item 2"],
      "marketplace_search_query": "exact string to search vendors",
      "estimated_budget_range": "$X - $Y"
    }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    res.json({ success: true, procurement_plan: JSON.parse(response.choices[0].message.content) });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});
const PORT = process.env.PM_PORT || 3010;
app.listen(PORT, () => {
  console.log(`🏗️ KaraKata Enterprise PM (Jira/OpenProject Killer) running on http://localhost:${PORT}`);
});

