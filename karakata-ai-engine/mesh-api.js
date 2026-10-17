require('dotenv').config(); const express = require('express'); const cors = require('cors'); const crypto = require('crypto'); const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json()); const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
app.post('/api/v1/mesh/register', async (req, res) => {
  try { const { hostname, ip_address } = req.body;
    const auth_key = 'kara_mesh_' + crypto.randomBytes(16).toString('hex');
    const { data, error } = await supabase.from('mesh_nodes').insert([{ hostname, ip_address, public_key: auth_key, status: 'online' }]).select().single();
    if(error) throw error; res.status(201).json({ success: true, node: data, auth_key });
  } catch(e) { res.status(500).json({ success: false, error: e.message }); }
});
const PORT = process.env.MESH_PORT || 3048;
app.listen(PORT, () => console.log(`🔒 KaraKata Mesh (Tailscale) running on http://localhost:${PORT}`));
