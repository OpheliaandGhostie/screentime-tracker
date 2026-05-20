export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { app, action } = req.query;
  
  if (!app || !action) {
    return res.status(400).json({ error: 'Missing parameters' });
  }

  const timestamp = new Date().toISOString();
  const record = { app, action, timestamp };

  // 使用 Vercel KV 存储数据
  try {
    const { kv } = await import('@vercel/kv');
    const key = `records:${new Date().toISOString().split('T')[0]}`;
    await kv.rpush(key, JSON.stringify(record));
    await kv.expire(key, 86400); // 24小时过期
    
    return res.status(200).json({ success: true, record });
  } catch (error) {
    return res.status(200).json({ 
      success: true, 
      record, 
      note: 'KV not configured - demo mode' 
    });
  }
}
