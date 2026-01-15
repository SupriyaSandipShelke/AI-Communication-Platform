import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const analyticsRouter = Router();

// Apply authentication middleware to all routes
analyticsRouter.use(authenticateToken);

// Helper function to parse time range
function getDateRange(range: string, customStart?: string, customEnd?: string): { start: Date; end: Date } {
  const end = new Date();
  let start: Date;

  switch (range) {
    case '24h':
      start = new Date(Date.now() - 24 * 60 * 60 * 1000);
      break;
    case '7d':
      start = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      start = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      start = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'custom':
      start = customStart ? new Date(customStart) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      return { start, end: customEnd ? new Date(customEnd) : end };
    default:
      start = new Date(0); // All time
  }

  return { start, end };
}

// Comprehensive analytics endpoint
analyticsRouter.get('/comprehensive', async (req, res) => {
  try {
    const { range = '7d', start: customStart, end: customEnd } = req.query;
    const dbService = req.app.locals.dbService;
    const { start, end } = getDateRange(range as string, customStart as string, customEnd as string);

    // Get all messages in range
    const allMessages = await dbService.getMessages({ limit: 10000 });
    const messagesInRange = allMessages.filter((msg: any) => {
      const msgDate = new Date(msg.timestamp);
      return msgDate >= start && msgDate <= end;
    });

    // Platform distribution
    const platforms: Record<string, number> = {};
    messagesInRange.forEach((msg: any) => {
      const platform = msg.platform || 'Direct';
      platforms[platform] = (platforms[platform] || 0) + 1;
    });

    // Priority stats
    const priorityStats = {
      high: messagesInRange.filter((m: any) => m.priority === 'high').length,
      medium: messagesInRange.filter((m: any) => m.priority === 'medium').length,
      low: messagesInRange.filter((m: any) => m.priority === 'low').length
    };

    // Time series data (daily aggregation)
    const timeSeriesMap: Record<string, { messages: number; responses: number }> = {};
    messagesInRange.forEach((msg: any) => {
      const date = new Date(msg.timestamp).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      if (!timeSeriesMap[date]) {
        timeSeriesMap[date] = { messages: 0, responses: 0 };
      }
      timeSeriesMap[date].messages++;
      if (msg.isResponse) {
        timeSeriesMap[date].responses++;
      }
    });

    const timeSeriesData = Object.entries(timeSeriesMap).map(([date, data]) => ({
      date,
      messages: data.messages,
      responses: data.responses
    }));

    // Sentiment analysis (mock data - would integrate with AI service)
    const sentimentData = {
      positive: Math.floor(messagesInRange.length * 0.6),
      neutral: Math.floor(messagesInRange.length * 0.3),
      negative: Math.floor(messagesInRange.length * 0.1)
    };

    // Engagement rate calculation
    const totalMessages = messagesInRange.length;
    const responsesCount = messagesInRange.filter((m: any) => m.isResponse).length;
    const engagementRate = totalMessages > 0 ? (responsesCount / totalMessages) * 100 : 0;

    // Average response time (mock calculation)
    const avgResponseTime = 2.3 + (Math.random() * 2 - 1); // 1.3 - 3.3 minutes

    // Peak hours analysis
    const hourCounts: Record<number, number> = {};
    for (let i = 0; i < 24; i++) hourCounts[i] = 0;
    
    messagesInRange.forEach((msg: any) => {
      const hour = new Date(msg.timestamp).getHours();
      hourCounts[hour]++;
    });

    const peakHours = Object.entries(hourCounts).map(([hour, count]) => ({
      hour: parseInt(hour),
      count
    }));

    res.json({
      success: true,
      data: {
        platforms,
        priorityStats,
        timeSeriesData,
        sentimentData,
        engagementRate,
        avgResponseTime,
        peakHours
      }
    });
  } catch (error: any) {
    console.error('Comprehensive analytics error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get analytics for date range
analyticsRouter.get('/', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const dbService = req.app.locals.dbService;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await dbService.getAnalytics(start, end);

    res.json({ success: true, analytics });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get message counts by priority
analyticsRouter.get('/priority', async (req, res) => {
  try {
    const dbService = req.app.locals.dbService;

    const highPriority = await dbService.getMessages({ priority: 'high', limit: 1000 });
    const mediumPriority = await dbService.getMessages({ priority: 'medium', limit: 1000 });
    const lowPriority = await dbService.getMessages({ priority: 'low', limit: 1000 });

    res.json({
      success: true,
      counts: {
        high: highPriority.length,
        medium: mediumPriority.length,
        low: lowPriority.length
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get platform distribution
analyticsRouter.get('/platforms', async (req, res) => {
  try {
    const dbService = req.app.locals.dbService;
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate as string) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate as string) : new Date();

    const analytics = await dbService.getAnalytics(start, end);

    // Group by platform
    const platformData: Record<string, number> = {};
    analytics.forEach((row: any) => {
      platformData[row.platform] = (platformData[row.platform] || 0) + row.message_count;
    });

    res.json({ success: true, platforms: platformData });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get real-time metrics
analyticsRouter.get('/realtime', async (req, res) => {
  try {
    const dbService = req.app.locals.dbService;
    
    // Get messages from last 5 minutes
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const recentMessages = await dbService.getMessages({ limit: 1000 });
    const realTimeMessages = recentMessages.filter((msg: any) => 
      new Date(msg.timestamp) >= fiveMinutesAgo
    );

    res.json({
      success: true,
      data: {
        messagesLastFiveMin: realTimeMessages.length,
        activeUsers: new Set(realTimeMessages.map((m: any) => m.sender)).size,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Export analytics data
analyticsRouter.get('/export', async (req, res) => {
  try {
    const { format = 'json', range = '30d' } = req.query;
    const dbService = req.app.locals.dbService;
    const { start, end } = getDateRange(range as string);

    const allMessages = await dbService.getMessages({ limit: 10000 });
    const messagesInRange = allMessages.filter((msg: any) => {
      const msgDate = new Date(msg.timestamp);
      return msgDate >= start && msgDate <= end;
    });

    if (format === 'csv') {
      let csv = 'Timestamp,Sender,Content,Platform,Priority\n';
      messagesInRange.forEach((msg: any) => {
        csv += `${msg.timestamp},"${msg.sender}","${msg.content}",${msg.platform || 'Direct'},${msg.priority || 'low'}\n`;
      });
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=analytics-${Date.now()}.csv`);
      res.send(csv);
    } else {
      res.json({
        success: true,
        data: messagesInRange,
        exportedAt: new Date().toISOString(),
        count: messagesInRange.length
      });
    }
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
