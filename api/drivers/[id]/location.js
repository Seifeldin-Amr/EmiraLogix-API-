import { supabase } from '../../../lib/supabase.js'

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

  if (req.method === 'PUT') {
    try {
      const { lat, lng } = req.body;
      
      if (lat === undefined || lng === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: lat, lng'
        });
      }
      
      // Update location
      const updateData = {
        lat: Number(lat),
        lng: Number(lng),
        last_location_update: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('drivers')
        .update(updateData)
        .eq('id', id)
        .select('id, name, lat, lng, last_location_update')
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
          error: 'Failed to update location: ' + error.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: data,
        message: 'Driver location updated successfully'
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
      error: 'Method not allowed. Use PUT to update location.'
    });
  }
}
