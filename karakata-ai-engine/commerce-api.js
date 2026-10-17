require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');
const app = express(); app.use(cors()); app.use(express.json());
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

app.post('/api/v1/commerce/product', async (req, res) => {
  try {
    const { title, price, inventory_count } = req.body;
    const { data } = await supabase.from('commerce_products').insert([{ title, price, inventory_count }]).select().single();
    res.status(201).json({ success: true, product: data });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

app.post('/api/v1/commerce/checkout', async (req, res) => {
  try {
    const { product_id, user_id } = req.body;
    const { data: product } = await supabase.from('commerce_products').select('*').eq('id', product_id).single();
    if (product.inventory_count <= 0) return res.status(400).json({ error: "Out of stock" });
    
    await supabase.from('commerce_products').update({ inventory_count: product.inventory_count - 1 }).eq('id', product_id);
    await supabase.from('commerce_carts').insert([{ user_id, status: 'checked_out' }]);
    
    res.json({ success: true, message: "Checkout successful. Inventory decremented." });
  } catch (error) { res.status(500).json({ success: false, error: error.message }); }
});

const PORT = process.env.COMMERCE_PORT || 3017;
app.listen(PORT, () => console.log(`🛒 KaraKata Commerce API running on http://localhost:${PORT}`));
