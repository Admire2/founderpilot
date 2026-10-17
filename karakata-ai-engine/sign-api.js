require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/sign/document', async (req, res) => {
  try {
    const { title, signer_email } = req.body;
    const { data: doc } = await supabase.from('sign_documents').insert([{ title }]).select().single();
    await supabase.from('sign_requests').insert([{ document_id: doc.id, signer_email }]);
    res.status(201).json({ success: true, document: doc, message: "Signature request sent." });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/v1/sign/execute', async (req, res) => {
  try {
    const { document_id, signer_email, signature_data } = req.body;
    await supabase.from('sign_requests').update({ signature_data, signed_at: new Date() }).eq('document_id', document_id).eq('signer_email', signer_email);
    await supabase.from('sign_documents').update({ status: 'signed' }).eq('id', document_id);
    res.json({ success: true, message: "Document legally signed and locked." });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.SIGN_PORT || 3015;
app.listen(PORT, () => console.log(`✍️ KaraKata Sign API running on http://localhost:${PORT}`));
