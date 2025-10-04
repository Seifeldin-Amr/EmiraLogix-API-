import { supabase } from '../../lib/supabase.js'

// Calculate distance between two points using Haversine formula
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

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
    // Get order details
    const { data: order, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .or(`id.eq.${orderId},order_id.eq.${orderId}`)
      .single();

    if (orderError || !order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }

    if (order.driver_id) {
      return res.status(400).json({
        success: false,
        error: 'Order is already assigned to a driver'
      });
    }

    // Get all available drivers with location
    const { data: drivers, error: driversError } = await supabase
      .from('drivers')
      .select('*')
      .eq('status', 'available')
      .not('lat', 'is', null)
      .not('lng', 'is', null);

    if (driversError || !drivers || drivers.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No available drivers with location found'
      });
    }

    // Find nearest driver
    let nearestDriver = null;
    let minDistance = Infinity;

    drivers.forEach(driver => {
      const distance = calculateDistance(
        parseFloat(order.lat),
        parseFloat(order.lng),
        parseFloat(driver.lat),
        parseFloat(driver.lng)
      );
      
      if (distance < minDistance) {
        minDistance = distance;
        nearestDriver = driver;
      }
    });

    if (!nearestDriver) {
      return res.status(400).json({
        success: false,
        error: 'No suitable driver found'
      });
    }

    // Assign the nearest driver
    const { data: updatedOrder, error: updateError } = await supabase
      .from('orders')
      .update({
        driver_id: nearestDriver.id,
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

    if (updateError) {
      return res.status(400).json({
        success: false,
        error: 'Failed to assign driver: ' + updateError.message
      });
    }

    // Update driver status to busy
    await supabase
      .from('drivers')
      .update({ status: 'busy' })
      .eq('id', nearestDriver.id);

    res.status(200).json({
      success: true,
      data: {
        ...updatedOrder,
        assignment_info: {
          distance_km: Math.round(minDistance * 100) / 100,
          driver_assigned: nearestDriver.name,
          assignment_method: 'auto'
        }
      },
      message: `Nearest driver ${nearestDriver.name} auto-assigned successfully`
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Internal server error: ' + error.message
    });
  }
}
