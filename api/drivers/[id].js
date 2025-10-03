import { supabase } from '../../lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Get driver by ID
      const { data, error } = await supabase
        .from('drivers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch driver: ' + error.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: data
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Internal server error: ' + err.message
      });
    }
  }
  else if (req.method === 'PUT') {
    try {
      // Update driver data
      const { name, phone, vehicle_type, license_plate, lat, lng, status } = req.body;
      
      // Build update object with only provided fields
      const updateData = {};
      if (name) updateData.name = name;
      if (phone) updateData.phone = phone;
      if (vehicle_type) updateData.vehicle_type = vehicle_type;
      if (license_plate) updateData.license_plate = license_plate;
      if (status) updateData.status = status;
      
      // Update location if provided
      if (lat !== undefined && lng !== undefined) {
        updateData.lat = Number(lat);
        updateData.lng = Number(lng);
        updateData.last_location_update = new Date().toISOString();
      }
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }
      
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Driver not found'
        });
      }
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update driver: ' + error.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: data,
        message: 'Driver updated successfully'
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
