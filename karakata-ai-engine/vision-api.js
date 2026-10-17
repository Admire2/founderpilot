require('dotenv').config();
const express = require('express');
const cors = require('cors');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

// Use OpenAI gpt-4o for bulletproof, production-ready vision analysis
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

app.post('/api/v1/vision/analyze', async (req, res) => {
  try {
    const { imageUrl, industry, task } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const systemPrompt = `You are Kara-Vision, an expert AI image analyzer for the ${industry || 'general'} industry. 
    Task: ${task || 'Analyze this image and extract key features, condition, and any notable anomalies.'}
    
    Respond ONLY in valid JSON format with the following structure:
    {
      "summary": "A brief 1-sentence overview of the image.",
      "key_features": ["feature 1", "feature 2", "feature 3"],
      "condition_or_issues": "Description of condition or any red flags.",
      "confidence_score": 0.95
    }`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // Rock-solid, never decommissioned
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: systemPrompt },
            {
              type: 'image_url',
              image_url: { url: imageUrl }
            }
          ]
        }
      ],
      temperature: 0.1,
      max_tokens: 500
    });

    const responseText = response.choices[0]?.message?.content || '{}';
    
    let parsedResponse;
    try {
      const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (parseError) {
      parsedResponse = { raw_output: responseText, error: 'Failed to parse JSON' };
    }

    res.json({
      success: true,
      industry: industry || 'general',
      analysis: parsedResponse
    });

  } catch (error) {
    console.error('Vision API Error:', error.message);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to analyze image', 
      details: error.message 
    });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Kara-Image Vision API running on http://localhost:${PORT}`);
  console.log(`📡 Test endpoint: POST http://localhost:${PORT}/api/v1/vision/analyze`);
});
