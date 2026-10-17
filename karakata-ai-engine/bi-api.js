require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 1. AGGREGATE DATA ENDPOINT (The "Metabase" layer)
app.get('/api/v1/bi/overview', async (req, res) => {
  try {
    // Fetch Real Estate Stats
    const { count: propertyCount } = await supabase.from('properties').select('*', { count: 'exact', head: true });
    const { data: highDistress } = await supabase.from('properties').select('address, distress_score').gt('distress_score', 75).limit(5);

    // Fetch Marketplace Stats
    const { count: vendorCount } = await supabase.from('vendors').select('*', { count: 'exact', head: true });
    const { count: bookingCount } = await supabase.from('bookings').select('*', { count: 'exact', head: true });

    res.json({
      success: true,
      timestamp: new Date().toISOString(),
      metrics: {
        real_estate: { total_properties_scored: propertyCount || 0, high_distress_leads: highDistress || [] },
        marketplace: { active_vendors: vendorCount || 0, total_bookings: bookingCount || 0 }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. AI STRATEGIC INSIGHTS ENDPOINT (The "Palantir" layer)
app.post('/api/v1/bi/insights', async (req, res) => {
  try {
    const { metrics } = req.body;

    const prompt = `You are an elite Business Intelligence AI (like Palantir). Analyze the following cross-platform metrics for KaraKata (North America focus) and generate a strategic intelligence brief.
    
    Metrics: ${JSON.stringify(metrics)}

    Respond ONLY in valid JSON format with this structure:
    {
      "executive_summary": "A 2-sentence high-level overview of the business health.",
      "key_correlations": ["Insight 1 connecting two different data points", "Insight 2"],
      "actionable_recommendations": ["Recommendation 1", "Recommendation 2"],
      "risk_alerts": ["Any potential risks based on the data, or 'None detected'"]
    }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.2,
      response_format: { type: 'json_object' }
    });

    const aiText = response.choices[0]?.message?.content || '{}';
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiText.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
      parsedResponse = { raw_output: aiText };
    }

    res.json({ success: true, intelligence_brief: parsedResponse });

  } catch (error) {
    console.error('BI Insights Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3006;
app.listen(PORT, () => {
  console.log(`📊 KaraKata Business Intelligence API running on http://localhost:${PORT}`);
});
