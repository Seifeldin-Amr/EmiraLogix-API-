import { supabase } from '../../lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'PUT') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }

  const { id: orderId } = req.query;
  const { driver_id } = req.body;

  if (!driver_id) {
    return res.status(400).json({
      success: false,
      error: 'driver_id is required'
    });
  }

  try {
    // Check if driver exists and is available
    const { data: driver, error: driverError } = await supabase
      .from('drivers')
      .select('*')
      .eq('id', driver_id)
      .eq('status', 'available')
      .single();

    if (driverError || !driver) {
      return res.status(400).json({
        success: false,
        error: 'Driver not found or not available'
      });
    }

    // Check if order exists and is not already assigned
    const { data: existingOrder, error: orderCheckError } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${orderId},order_id.eq.${orderId}`)
      .single();

    if (orderCheckError) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (existingOrder.driver_id) {
      return res.status(400).json({
        success: false,
        error: 'Order is already assigned to a driver'
      });
    }

    // Update order with driver assignment
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .update({
        driver_id: driver_id,
        status: 'assigned',
        updated_at: new Date().toISOString()
      })
      .or(`id.eq.${orderId},order_id.eq.${orderId}`)
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
      .single();

    if (orderError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to assign driver: ' + orderError.message
      });
    }

    // Update driver status to busy
    await supabase
      .from('drivers')
      .update({ status: 'busy' })
      .eq('id', driver_id);

    res.status(200).json({
      success: true,
      data: order,
      message: `Driver ${driver.name} assigned to order successfully`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}
