import { supabase } from '../lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Get customer by ID
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch customer: ' + error.message
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
      // Update customer
      const { customer_name, phone, chat_id, address } = req.body;
      
      // Build update object with only provided fields
      const updateData = {};
      if (customer_name) updateData.customer_name = customer_name;
      if (phone) updateData.phone = phone;
      if (chat_id !== undefined) updateData.chat_id = chat_id ? Number(chat_id) : null;
      if (address !== undefined) updateData.address = address;
      
      if (Object.keys(updateData).length === 0) {
        return res.status(400).json({
          success: false,
          error: 'No fields to update'
        });
      }
      
      updateData.updated_at = new Date().toISOString();
      
      const { data, error } = await supabase
        .from('customers')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to update customer: ' + error.message
        });
      }
      
      res.status(200).json({
        success: true,
        data: data,
        message: 'Customer updated successfully'
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
