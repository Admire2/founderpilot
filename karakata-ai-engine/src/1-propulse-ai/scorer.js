const Groq = require('groq-sdk');
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// Mock data representing a public record scrape (Distressed property)
const mockPropertyData = {
  address: "123 Peachtree St, Atlanta, GA 30303",
  owner: "John Doe",
  years_owned: 12,
  mortgage_balance: 150000,
  estimated_value: 350000,
  tax_delinquency: true,
  code_violations: 2,
  absentee_owner: true
};

async function scoreProperty(property) {
  console.log(`\n?? Propulse AI: Analyzing property at ${property.address}...`);

  const prompt = `You are a real estate investment AI. Analyze the following property data and output a JSON object with:
  1. distress_score: A number from 0-100 indicating how motivated the seller is to sell quickly.
  2. estimated_equity: Calculate (estimated_value - mortgage_balance).
  3. reasoning: A brief 1-sentence explanation of why you gave this score.
  
  Property Data: ${JSON.stringify(property)}
  
  Output ONLY valid JSON.`;

  try {
    // Using llama-3.1-8b-instant for fast, cheap data processing
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'llama-3.1-8b-instant', 
      temperature: 0.1,
      response_format: { type: 'json_object' }
    });

    const aiResponse = JSON.parse(chatCompletion.choices[0].message.content);
    console.log(`? AI Score: ${aiResponse.distress_score}/100 | Equity: $${aiResponse.estimated_equity}`);
    console.log(` Reasoning: ${aiResponse.reasoning}`);

    // Save to Supabase
    const { data, error } = await supabase
      .from('properties')
      .insert([{
        address: property.address,
        owner_name: property.owner,
        estimated_equity: aiResponse.estimated_equity,
        distress_score: aiResponse.distress_score,
        ai_analysis: aiResponse.reasoning
      }])
      .select();

    if (error) throw error;
    console.log('?? Saved to Propulse AI Database! ID:', data[0].id);
    return data[0];

  } catch (error) {
    console.error('? Error scoring property:', error.message);
  }
}

// Run the engine
scoreProperty(mockPropertyData);
