import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const analyticsRouter = Router();

// Apply authentication middleware to all routes
analyticsRouter.use(authenticateToken);

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
