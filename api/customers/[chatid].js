import { supabase } from '../lib/supabase.js'

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { chatid } = req.query;

  if (req.method === 'GET') {
    try {
      // Get customer by chat_id
      const { data, error } = await supabase
        .from('customers')
        .select('*')
        .eq('chat_id', chatid)
        .single();
      
      if (error && error.code === 'PGRST116') {
        return res.status(404).json({
          success: false,
          error: 'Customer not found'
        });
      }
      
      if (error) {
        return res.status(500).json({
          success: false,
          error: 'Failed to fetch customer: ' + error.message
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
  else {
    res.status(405).json({
      success: false,
      error: 'Method not allowed'
    });
  }
}
