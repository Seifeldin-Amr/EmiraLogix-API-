export default function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Content-Type', 'application/json');
  
  res.status(200).json({
    message: 'Hello from EmiraLogix API!',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    status: 'API is working!'
  });
}
