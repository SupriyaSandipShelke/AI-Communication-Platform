import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const priorityRouter = Router();

// Apply authentication middleware to all routes
priorityRouter.use(authenticateToken);

/**
 * Evaluate message priority
 * POST /api/priority/evaluate
 * 
 * Body: {
 *   content: string;
 *   sender: string;
 *   roomId: string;
 *   previousMessages?: string[];
 * }
 */
priorityRouter.post('/evaluate', async (req, res) => {
  try {
    const { content, sender, roomId, previousMessages } = req.body;
    const priorityEngine = req.app.locals.priorityEngine;

    if (!content || !sender || !roomId) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields: content, sender, roomId',
      });
    }

    const priorityScore = await priorityEngine.evaluatePriority(
      content,
      sender,
      roomId,
      previousMessages
    );

    res.json({
      success: true,
      priority: priorityScore,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get priority inbox (high-priority messages)
 * GET /api/priority/inbox?limit=50
 */
priorityRouter.get('/inbox', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 50;
    const priorityEngine = req.app.locals.priorityEngine;
    const userId = (req as any).user?.id; // From auth middleware

    const inbox = await priorityEngine.getPriorityInbox(userId, limit);

    res.json({
      success: true,
      inbox,
      count: inbox.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Add VIP contact
 * POST /api/priority/vip
 * 
 * Body: { contactId: string }
 */
priorityRouter.post('/vip', async (req, res) => {
  try {
    const { contactId } = req.body;
    const priorityEngine = req.app.locals.priorityEngine;

    if (!contactId) {
      return res.status(400).json({
        success: false,
        error: 'contactId required',
      });
    }

    priorityEngine.addVIPContact(contactId);

    res.json({
      success: true,
      message: `${contactId} added to VIP contacts`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Remove VIP contact
 * DELETE /api/priority/vip/:contactId
 */
priorityRouter.delete('/vip/:contactId', async (req, res) => {
  try {
    const { contactId } = req.params;
    const priorityEngine = req.app.locals.priorityEngine;

    priorityEngine.removeVIPContact(contactId);

    res.json({
      success: true,
      message: `${contactId} removed from VIP contacts`,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
