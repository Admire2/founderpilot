require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

// 1. GET all services (with vendor info)
app.get('/api/v1/marketplace/services', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('services')
      .select('*, vendors(name, category, is_verified)')
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    res.json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    console.error('API Error (GET services):', error.message);
  }
});

// 2. POST a new booking
app.post('/api/v1/marketplace/bookings', async (req, res) => {
  try {
    const { service_id, customer_name, customer_phone, scheduled_date, notes } = req.body;
    
    if (!service_id || !customer_name || !customer_phone) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const { data, error } = await supabase
      .from('bookings')
      .insert([{ service_id, customer_name, customer_phone, scheduled_date, notes }])
      .select()
      .single();
      
    if (error) throw error;
    res.status(201).json({ success: true, message: 'Booking created successfully', data });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
    console.error('API Error (POST booking):', error.message);
  }
});

const PORT = process.env.PORT || 3002; // Using port 3002 to keep it separate from Vision API
app.listen(PORT, () => {
  console.log(`🏪 KaraKata Marketplace API running on http://localhost:${PORT}`);
  console.log(`📡 Test GET: http://localhost:${PORT}/api/v1/marketplace/services`);
});
