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
      // Get all customers or filter by phone/chat_id
      const { phone, chat_id } = req.query;
      
      let query = supabase.from('customers').select('*').order('created_at', { ascending: false });
      
      if (phone) {
        query = query.eq('phone', phone);
      }
      
      if (chat_id) {
        query = query.eq('chat_id', Number(chat_id));
      }
      
      const { data, error } = await query;
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch customers: ' + error.message
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
      // Create new customer or get existing one
      const { customer_name, phone, chat_id, address } = req.body;
      
      if (!customer_name || !phone) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: customer_name, phone'
        });
      }
      
      // First check if customer already exists by phone
      const { data: existingCustomer, error: checkError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (checkError && checkError.code !== 'PGRST116') {
        return res.status(500).json({
          success: false,
          error: 'Failed to check existing customer: ' + checkError.message
        });
      }
      
      if (existingCustomer) {
        // Customer exists, update if needed
        const updateData = {};
        if (chat_id !== undefined && existingCustomer.chat_id !== Number(chat_id)) {
          updateData.chat_id = Number(chat_id);
        }
        if (address && existingCustomer.address !== address) {
          updateData.address = address;
        }
        if (customer_name && existingCustomer.customer_name !== customer_name) {
          updateData.customer_name = customer_name;
        }
        
        if (Object.keys(updateData).length > 0) {
          updateData.updated_at = new Date().toISOString();
          
          const { data: updatedCustomer, error: updateError } = await supabase
            .from('customers')
            .update(updateData)
            .eq('id', existingCustomer.id)
            .select()
            .single();
          
          if (updateError) {
            return res.status(500).json({
              success: false,
              error: 'Failed to update customer: ' + updateError.message
            });
          }
          
          return res.status(200).json({
            success: true,
            data: updatedCustomer,
            message: 'Customer updated successfully'
          });
        } else {
          return res.status(200).json({
            success: true,
            data: existingCustomer,
            message: 'Customer already exists'
          });
        }
      }
      
      // Create new customer
      const newCustomer = {
        customer_name,
        phone,
        chat_id: chat_id ? Number(chat_id) : null,
        address: address || null
      };
      
      const { data, error } = await supabase
        .from('customers')
        .insert([newCustomer])
        .select();
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create customer: ' + error.message
        });
      }
      
      res.status(201).json({
        success: true,
        data: data[0],
        message: 'Customer created successfully'
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
