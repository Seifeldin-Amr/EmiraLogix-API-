export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    message: 'Ordering System API',
    version: '1.0.0',
    endpoints: {
      customers: {
        'GET /api/customers': 'Get all customers',
        'POST /api/customers': 'Create/update customer'
      },
      orders: {
        'GET /api/orders': 'Get all orders with customer and driver info',
        'POST /api/orders': 'Create new order (auto-creates/updates customer)',
        'GET /api/orders/[id]': 'Get order by ID with customer and driver info',
        'PUT /api/orders/[id]': 'Update order or assign driver (use action: "assign_driver" with driver_id)'
      },
      drivers: {
        'GET /api/drivers': 'Get all drivers',
        'POST /api/drivers': 'Add new driver',
        'GET /api/drivers/[id]': 'Get driver by ID',
        'PUT /api/drivers/[id]': 'Update driver',
        'PUT /api/drivers/[id]/location': 'Update driver location'
      }
    },
    documentation: 'See README.md for detailed API documentation'
  });
}
