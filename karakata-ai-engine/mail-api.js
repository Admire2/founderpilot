require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/mail/send', async (req, res) => {
  try {
    const { to_addr, subject, body } = req.body;
    const from_addr = process.env.GMAIL_USER;
    let status = 'sent';
    try {
      const transporter = nodemailer.createTransport({ service: 'gmail', auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD } });
      await transporter.sendMail({ from: from_addr, to: to_addr, subject, text: body });
    } catch (e) { status = 'failed'; }
    const { data, error } = await supabase.from('mail_messages').insert([{ direction: 'outbound', from_addr, to_addr, subject, body, status }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, status, mail: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/mail/log', async (req, res) => {
  const { data } = await supabase.from('mail_messages').select('*').order('created_at', { ascending: false }).limit(20);
  res.json({ success: true, mail_log: data });
});

const PORT = process.env.MAIL_PORT || 3036;
app.listen(PORT, () => console.log(`📧 KaraKata Mail (MailCow Killer) running on http://localhost:${PORT}`));
