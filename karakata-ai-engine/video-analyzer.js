require('dotenv').config();
const express = require('express');
const cors = require('cors');
const ffmpeg = require('fluent-ffmpeg');
const fs = require('fs');
const path = require('path');
const OpenAI = require('openai');

const app = express();
app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// Helper to extract frames from video
function extractFrames(videoUrl, outputDir) {
  return new Promise((resolve, reject) => {
    const frames = [];
    const timestamps = ['00:00:01', '50%', '95%']; // Start, Middle, End
    
    let completed = 0;
    timestamps.forEach((time, index) => {
      const outputPath = path.join(outputDir, `frame_${index}.jpg`);
      frames.push(outputPath);
      
      ffmpeg(videoUrl)
        .seekInput(time)
        .frames(1)
        .output(outputPath)
        .on('end', () => {
          completed++;
          if (completed === timestamps.length) resolve(frames);
        })
        .on('error', (err) => reject(err))
        .run();
    });
  });
}

app.post('/api/v1/video/analyze', async (req, res) => {
  try {
    const { videoUrl, propertyAddress } = req.body;
    if (!videoUrl) return res.status(400).json({ error: 'videoUrl is required' });

    const tempDir = path.join(__dirname, 'temp_frames');
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir);

    console.log('🎥 Extracting frames from video...');
    const frames = await extractFrames(videoUrl, tempDir);

    // Build the vision prompt with multiple frames
    const content = [
      { type: 'text', text: `You are a luxury real estate copywriter. Analyze these 3 frames (start, middle, end) of a property walkthrough video at ${propertyAddress || 'this address'}. Write a compelling, Zillow-ready listing description. Highlight architectural style, key features (kitchen, floors, lighting), and overall condition. Respond ONLY in JSON: { "headline": "...", "description": "...", "key_features": ["...", "..."] }` }
    ];

    // Add images to the prompt
    frames.forEach(frame => {
      if (fs.existsSync(frame)) {
        const imageBase64 = fs.readFileSync(frame).toString('base64');
        content.push({ type: 'image_url', image_url: { url: `data:image/jpeg;base64,${imageBase64}` } });
      }
    });

    console.log(' Sending frames to OpenAI Vision...');
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [{ role: 'user', content: content }],
      temperature: 0.7,
      max_tokens: 800
    });

    const aiText = response.choices[0]?.message?.content || '{}';
    let parsedResponse;
    try {
      const cleanJson = aiText.replace(/```json/g, '').replace(/```/g, '').trim();
      parsedResponse = JSON.parse(cleanJson);
    } catch (e) {
      parsedResponse = { raw_description: aiText };
    }

    // Cleanup temp files
    frames.forEach(f => { if (fs.existsSync(f)) fs.unlinkSync(f); });

    res.json({ success: true, analysis: parsedResponse });

  } catch (error) {
    console.error('Video API Error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.PORT || 3003;
app.listen(PORT, () => {
  console.log(`🎥 Kara-Video API running on http://localhost:${PORT}`);
});
