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
      // Get all orders or filter by status
      const { status } = req.query;
      
      let query = supabase.from('orders').select('*').order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
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
      // Create new order
      const { order_id, customer_name, chat_id, address, lat, lng, status } = req.body;
      
      if (!order_id || !customer_name || !chat_id || !address || lat === undefined || lng === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields: order_id, customer_name, chat_id, address, lat, lng'
        });
      }
      
      const newOrder = {
        order_id,
        customer_name,
        chat_id: Number(chat_id),
        address,
        lat: Number(lat),
        lng: Number(lng),
        status: status || 'pending'
      };
      
      const { data, error } = await supabase
        .from('orders')
        .insert([newOrder])
        .select();
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to create order: ' + error.message
        });
      }

      // Trigger webhook after successful order creation
      try {
        const webhookUrl = process.env.WEBHOOK_URL || 'https://your-webhook-url.com/webhook';
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
