require('dotenv').config();
const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

const key = crypto.createHash('sha256').update(process.env.VAULT_MASTER_KEY || 'karakata-default').digest();
function encrypt(text) { const iv = crypto.randomBytes(16); const c = crypto.createCipheriv('aes-256-cbc', key, iv); let e = c.update(text, 'utf8', 'hex'); e += c.final('hex'); return iv.toString('hex') + ':' + e; }
function decrypt(payload) { const [ivHex, enc] = payload.split(':'); const d = crypto.createDecipheriv('aes-256-cbc', key, Buffer.from(ivHex, 'hex')); let t = d.update(enc, 'hex', 'utf8'); t += d.final('utf8'); return t; }

app.post('/api/v1/vault/store', async (req, res) => {
  try {
    const { name, secret_value, category, owner } = req.body;
    const encrypted = encrypt(secret_value);
    const { data, error } = await supabase.from('vault_secrets').insert([{ name, encrypted_value: encrypted, category, owner }]).select().single();
    if (error) throw error;
    res.status(201).json({ success: true, secret: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.get('/api/v1/vault/retrieve/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('vault_secrets').select('*').eq('id', req.params.id).single();
    if (error || !data) return res.status(404).json({ error: 'Secret not found' });
    res.json({ success: true, name: data.name, decrypted_value: decrypt(data.encrypted_value) });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.VAULT_PORT || 3037;
app.listen(PORT, () => console.log(`🔐 KaraKata Vault (Bitwarden Killer) running on http://localhost:${PORT}`));
