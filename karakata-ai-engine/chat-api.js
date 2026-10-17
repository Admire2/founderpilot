require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 1. START A CONVERSATION
app.post('/api/v1/chat/start', async (req, res) => {
  try {
    const { buyer_id, seller_id, marketplace_item_id } = req.body;
    if (!buyer_id || !seller_id) return res.status(400).json({ error: 'buyer_id and seller_id are required' });

    const { data, error } = await supabase.from('conversations').insert([{
      buyer_id, seller_id, marketplace_item_id
    }]).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, conversation_id: data.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 2. SEND A MESSAGE
app.post('/api/v1/chat/send', async (req, res) => {
  try {
    const { conversation_id, sender_id, text } = req.body;
    if (!conversation_id || !sender_id || !text) return res.status(400).json({ error: 'Missing fields' });

    const { data, error } = await supabase.from('messages').insert([{
      conversation_id, sender_id, text
    }]).select().single();

    if (error) throw error;
    res.status(201).json({ success: true, message_id: data.id });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// 3. GET CHAT HISTORY
app.get('/api/v1/chat/history/:conversationId', async (req, res) => {
  try {
    const { conversationId } = req.params;
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    res.json({ success: true, messages: data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

const PORT = process.env.CHAT_PORT || 3009;
app.listen(PORT, () => {
  console.log(`💬 KaraKata Communication Hub running on http://localhost:${PORT}`);
});
