import { Router } from 'express';
import cron from 'node-cron';

export const scheduledSummariesRouter = Router();

/**
 * Get user's scheduled summary settings
 * GET /api/summaries/scheduled
 */
scheduledSummariesRouter.get('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id; // From auth middleware
    const scheduledSummariesService = req.app.locals.scheduledSummariesService;

    if (!scheduledSummariesService || !scheduledSummariesService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled summaries service is not configured'
      });
    }

    const summary = await scheduledSummariesService.getUserScheduledSummary(userId);

    res.json({
      success: true,
      summary: summary || null
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Create or update scheduled summary
 * POST /api/summaries/scheduled
 * 
 * Body: { scheduleTime: string; timezone?: string }
 */
scheduledSummariesRouter.post('/', async (req, res) => {
  try {
    const { scheduleTime, timezone = 'UTC' } = req.body;
    const userId = (req as any).user?.id; // From auth middleware
    const scheduledSummariesService = req.app.locals.scheduledSummariesService;

    if (!scheduledSummariesService || !scheduledSummariesService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled summaries service is not configured'
      });
    }

    if (!scheduleTime) {
      return res.status(400).json({
        success: false,
        error: 'scheduleTime is required (HH:MM format)'
      });
    }

    // Validate time format (HH:MM)
    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(scheduleTime)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid time format. Use HH:MM (24-hour format)'
      });
    }

    const summary = await scheduledSummariesService.createScheduledSummary(
      userId,
      scheduleTime,
      timezone
    );

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Update scheduled summary
 * PATCH /api/summaries/scheduled
 * 
 * Body: { scheduleTime?: string; timezone?: string; enabled?: boolean }
 */
scheduledSummariesRouter.patch('/', async (req, res) => {
  try {
    const { scheduleTime, timezone, enabled } = req.body;
    const userId = (req as any).user?.id; // From auth middleware
    const scheduledSummariesService = req.app.locals.scheduledSummariesService;

    if (!scheduledSummariesService || !scheduledSummariesService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled summaries service is not configured'
      });
    }

    // Get user's existing scheduled summary
    const existingSummary = await scheduledSummariesService.getUserScheduledSummary(userId);
    if (!existingSummary) {
      return res.status(404).json({
        success: false,
        error: 'No scheduled summary found for user'
      });
    }

    const updatedSummary = await scheduledSummariesService.updateScheduledSummary(
      existingSummary.id,
      { scheduleTime, timezone, enabled }
    );

    res.json({
      success: true,
      summary: updatedSummary
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Delete scheduled summary
 * DELETE /api/summaries/scheduled
 */
scheduledSummariesRouter.delete('/', async (req, res) => {
  try {
    const userId = (req as any).user?.id; // From auth middleware
    const scheduledSummariesService = req.app.locals.scheduledSummariesService;

    if (!scheduledSummariesService || !scheduledSummariesService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled summaries service is not configured'
      });
    }

    // Get user's existing scheduled summary
    const existingSummary = await scheduledSummariesService.getUserScheduledSummary(userId);
    if (!existingSummary) {
      return res.status(404).json({
        success: false,
        error: 'No scheduled summary found for user'
      });
    }

    await scheduledSummariesService.deleteScheduledSummary(existingSummary.id);

    res.json({
      success: true,
      message: 'Scheduled summary deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get today's summary
 * GET /api/summaries/daily
 */
scheduledSummariesRouter.get('/daily', async (req, res) => {
  try {
    const userId = (req as any).user?.id; // From auth middleware
    const scheduledSummariesService = req.app.locals.scheduledSummariesService;

    if (!scheduledSummariesService || !scheduledSummariesService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled summaries service is not configured'
      });
    }

    const summary = await scheduledSummariesService.getDailySummary(userId);

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get weekly summary
 * GET /api/summaries/weekly?daysBack
 */
scheduledSummariesRouter.get('/weekly', async (req, res) => {
  try {
    const userId = (req as any).user?.id; // From auth middleware
    const { daysBack = 7 } = req.query;
    const scheduledSummariesService = req.app.locals.scheduledSummariesService;

    if (!scheduledSummariesService || !scheduledSummariesService.isConfigured()) {
      return res.status(400).json({
        success: false,
        error: 'Scheduled summaries service is not configured'
      });
    }

    const summary = await scheduledSummariesService.getWeeklySummary(
      userId,
      parseInt(daysBack as string)
    );

    res.json({
      success: true,
      summary
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});