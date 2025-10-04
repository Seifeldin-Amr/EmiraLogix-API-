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

  const { id } = req.query;

  if (req.method === 'GET') {
    try {
      // Get order by ID or order_id with customer information
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
      const { action, driver_id, customer_id, address, lat, lng, status } = req.body;
      
      // Handle driver assignment
      if (action === 'assign_driver') {
        if (!driver_id) {
          return res.status(400).json({
            success: false,
            error: 'driver_id is required for driver assignment'
          });
        }

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

        // Update order with driver assignment
        const { data, error } = await supabase
          .from('orders')
          .update({
            driver_id: driver_id,
            status: 'assigned',
            updated_at: new Date().toISOString()
          })
          .or(`id.eq.${id},order_id.eq.${id}`)
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

        if (error && error.code === 'PGRST116') {
          return res.status(404).json({
            success: false,
            error: 'Order not found'
          });
        }

        if (error) {
          return res.status(500).json({
            success: false,
            error: 'Failed to assign driver: ' + error.message
          });
        }

        // Update driver status to busy
        await supabase
          .from('drivers')
          .update({ status: 'busy' })
          .eq('id', driver_id);

        return res.status(200).json({
          success: true,
          data: data,
          message: `Driver ${driver.name} assigned successfully`
        });
      }

      // Regular order update
      const updateData = {};
      if (customer_id !== undefined) updateData.customer_id = Number(customer_id);
      if (driver_id !== undefined) updateData.driver_id = driver_id ? Number(driver_id) : null;
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
