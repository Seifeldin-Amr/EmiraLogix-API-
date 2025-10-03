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
      // Get order by ID or order_id
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .or(`id.eq.${id},order_id.eq.${id}`)
        .single();
      
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch order: ' + error.message
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
      // Update order
      const { customer_name, address, lat, lng, status } = req.body;
      
      // Build update object with only provided fields
      const updateData = {};
      if (customer_name) updateData.customer_name = customer_name;
      if (address) updateData.address = address;
      if (lat !== undefined) updateData.lat = Number(lat);
      if (lng !== undefined) updateData.lng = Number(lng);
      if (status) updateData.status = status;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }
      
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('orders')
        .update(updateData)
        .or(`id.eq.${id},order_id.eq.${id}`)
        .select()
        .single();
      
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Order not found'
        });
      }
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update order: ' + error.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: data,
        message: 'Order updated successfully'
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
