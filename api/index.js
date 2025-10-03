export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    message: 'Ordering System API',
    version: '1.0.0',
    endpoints: {
      orders: {
        'GET /api/orders': 'Get all orders',
        'POST /api/orders': 'Create new order',
        'GET /api/orders/[id]': 'Get order by ID',
        'PUT /api/orders/[id]': 'Update order'
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
