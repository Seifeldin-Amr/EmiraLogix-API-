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
      // Get all orders with customer information or filter by status
      const { status, customer_id } = req.query;
      
      let query = supabase.from('orders')
        .select(`
          *,
          customer:customers(
            id,
            customer_name,
            phone,
            chat_id,
            address
          )
        `)
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      if (customer_id) {
        query = query.eq('customer_id', customer_id);
      }
      
      const { data, error } = await query;
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch orders: ' + error.message
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
      // Create new order with customer handling
      const { order_id, customer_name, phone, chat_id, address, lat, lng, status } = req.body;
      
      if (!order_id || !customer_name || !phone || !address || lat === undefined || lng === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: order_id, customer_name, phone, address, lat, lng'
        });
      }
      
      // First, find or create customer
      let customer;
      
      // Check if customer exists by phone
      const { data: existingCustomer, error: customerCheckError } = await supabase
        .from('customers')
        .select('*')
        .eq('phone', phone)
        .single();
      
      if (customerCheckError && customerCheckError.code !== 'PGRST116') {
        return res.status(500).json({
          success: false,
          error: 'Failed to check existing customer: ' + customerCheckError.message
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
          
          customer = updatedCustomer;
        } else {
          customer = existingCustomer;
        }
      } else {
        // Create new customer
        const newCustomer = {
          customer_name,
          phone,
          chat_id: chat_id ? Number(chat_id) : null,
          address
        };
        
        const { data: createdCustomer, error: createError } = await supabase
          .from('customers')
          .insert([newCustomer])
          .select()
          .single();
        
        if (createError) {
          return res.status(500).json({
            success: false,
            error: 'Failed to create customer: ' + createError.message
          });
        }
        
        customer = createdCustomer;
      }
      
      // Now create the order
      const newOrder = {
        order_id,
        customer_id: customer.id,
        address,
        lat: Number(lat),
        lng: Number(lng),
        status: status || 'pending'
      };
      
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select(`
          *,
          customer:customers(
            id,
            customer_name,
            phone,
            chat_id,
            address
          )
        `);
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create order: ' + error.message
        });
      }

      // Trigger webhook after successful order creation
      try {
        const webhookUrl = process.env.WEBHOOK_URL || 'https://sensuously-soapier-rheba.ngrok-free.dev/webhook-test/add-order';
        const webhookResponse = await fetch(webhookUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            event: 'order_created',
            order: data[0],
            timestamp: new Date().toISOString()
          })
        });
        
        console.log('Webhook called:', webhookResponse.status);
      } catch (webhookError) {
        console.error('Webhook call failed:', webhookError.message);
        // Don't fail the order creation if webhook fails
      }
      
      res.status(201).json({
        success: true,
        data: data[0],
        message: 'Order created successfully'
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
