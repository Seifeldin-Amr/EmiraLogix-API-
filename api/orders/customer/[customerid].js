import { supabase } from '../../lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { customerid } = req.query;

  if (req.method === 'GET') {
    try {
      // Get all active orders for a specific customer
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          customer:customers(
            id,
            customer_name,
            phone,
            chat_id,
            address
          ),
          driver:drivers(
            id,
            name,
            phone,
            vehicle_type,
            license_plate,
            status
          )
        `)
        .eq('customer_id', customerid)
        .in('status', ['pending', 'assigned', 'in_progress', 'picked_up'])
        .order('created_at', { ascending: false });
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch orders: ' + error.message
        });
      }
      
      if (data.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'No active orders found for this customer'
        });
      }
      
      res.status(200).json({
        success: true,
        data: data,
        count: data.length,
        message: `Found ${data.length} active orders for customer`
      });
    } catch (err) {
      res.status(500).json({
        success: false,
        error: 'Internal server error: ' + err.message
      });
    }
  } else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
