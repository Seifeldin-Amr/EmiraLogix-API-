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

  try {
    // Get order details including current driver
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select(`
        *,
        driver:drivers(id, name, status)
      `)
      .or(`id.eq.${orderId},order_id.eq.${orderId}`)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (!order.driver_id) {
      return res.status(400).json({
        success: false,
        error: 'Order is not assigned to any driver'
      });
    }

    const currentDriverId = order.driver_id;

    // Update order to remove driver assignment
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        driver_id: null,
        status: 'pending',
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

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to unassign driver: ' + updateError.message
      });
    }

    // Update driver status back to available
    await supabase
      .from('drivers')
      .update({ status: 'available' })
      .eq('id', currentDriverId);

    res.status(200).json({
      success: true,
      data: updatedOrder,
      message: `Driver unassigned from order successfully`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}
