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

app.post('/api/v1/propulse/score', async (req, res) => {
  try {
    const { address, city, state, zip_code, owner_name, years_owned, mortgage_balance, estimated_value, tax_delinquency, code_violations, absentee_owner } = req.body;

    if (!address) return res.status(400).json({ error: 'address is required' });

    const propertyData = { address, city, state, zip_code, owner_name, years_owned, mortgage_balance, estimated_value, tax_delinquency, code_violations, absentee_owner };

    const prompt = `You are an elite real estate investment AI. Analyze the following property data and output a JSON object with:
    1. distress_score: A number from 0-100 indicating how motivated the seller is to sell quickly.
    2. estimated_equity: Calculate (estimated_value - mortgage_balance). If negative, set to 0.
    3. ai_analysis: A JSON object containing "reasoning" (brief explanation of the score) and "recommended_approach" (e.g., 'Short Sale', 'Cash Offer', 'Traditional').
    
    Property Data: ${JSON.stringify(propertyData)}
    
    Respond ONLY with valid JSON.`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const aiText = response.choices[0]?.message?.content || '{}';
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(aiText);
    } catch (e) {
      parsedResponse = { distress_score: 0, estimated_equity: 0, ai_analysis: { reasoning: 'Parse error', recommended_approach: 'Unknown' } };
    }

    // Save to Supabase
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        address, city, state, zip_code, owner_name,
        estimated_equity: parsedResponse.estimated_equity,
        distress_score: parsedResponse.distress_score,
        ai_analysis: parsedResponse.ai_analysis
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, data });

  } catch (error) {
    console.error('Propulse AI Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3004;
app.listen(PORT, () => {
  console.log(`📊 Propulse AI Data Engine running on http://localhost:${PORT}`);
});
