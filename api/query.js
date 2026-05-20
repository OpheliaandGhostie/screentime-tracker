export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { kv } = await import('@vercel/kv');
    const today = new Date().toISOString().split('T')[0];
    const key = `records:${today}`;
    
    const records = await kv.lrange(key, 0, -1);
    const parsed = records.map(r => JSON.parse(r));
    
    // 计算统计数据
    const appStats = {};
    for (let i = 0; i < parsed.length - 1; i++) {
      const current = parsed[i];
      const next = parsed[i + 1];
      
      if (current.action === 'open' && next.action === 'close' && current.app === next.app) {
        const duration = new Date(next.timestamp) - new Date(current.timestamp);
        if (!appStats[current.app]) {
          appStats[current.app] = { duration: 0, opens: 0 };
        }
        appStats[current.app].duration += duration;
        appStats[current.app].opens += 1;
      }
    }
    
    // 格式化输出
    const apps = Object.entries(appStats).map(([name, stats]) => ({
      name,
      duration: Math.round(stats.duration / 60000) + '分钟',
      opens: stats.opens
    }));
    
    const totalMinutes = Object.values(appStats).reduce((sum, s) => sum + s.duration, 0) / 60000;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = Math.round(totalMinutes % 60);
    
    return res.status(200).json({
      today: {
        totalScreenTime: `${hours}小时${minutes}分钟`,
        apps
      }
    });
  } catch (error) {
    return res.status(200).json({
      today: {
        totalScreenTime: '演示模式',
        apps: [
          { name: '小红书', duration: '47分钟', opens: 3 },
          { name: 'Claude', duration: '156分钟', opens: 8 }
        ]
      }
    });
  }
}
