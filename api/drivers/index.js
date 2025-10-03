import { supabase } from '../lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    try {
      // Get all drivers or filter by status
      const { status } = req.query;
      
      let query = supabase.from('drivers').select('*').order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch drivers: ' + error.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: data || [],
        count: data ? data.length : 0
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Internal server error: ' + err.message
      });
    }
  } 
  else if (req.method === 'POST') {
    try {
      // Add new driver
      const { name, phone, vehicle_type, license_plate, lat, lng } = req.body;
      
      if (!name || !phone || !vehicle_type || !license_plate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: name, phone, vehicle_type, license_plate'
        });
      }
      
      const newDriver = {
        name,
        phone,
        vehicle_type,
        license_plate,
        lat: lat ? Number(lat) : null,
        lng: lng ? Number(lng) : null,
        status: 'available',
        last_location_update: lat && lng ? new Date().toISOString() : null
      };
      
      const { data, error } = await supabase
        .from('drivers')
        .insert([newDriver])
        .select();
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create driver: ' + error.message
        });
      }
      
      res.status(201).json({
        success: true,
        data: data[0],
        message: 'Driver added successfully'
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Internal server error: ' + err.message
      });
    }
  }
  else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
