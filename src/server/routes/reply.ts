import { Router } from 'express';
import multer from 'multer';
import { authenticateToken } from '../middleware/auth.js';

export const replyRouter = Router();

// Apply authentication middleware to all routes
replyRouter.use(authenticateToken);

/**
 * Suggest reply draft
 * POST /api/reply/suggest
 * 
 * Body: {
 *   messageContent: string;
 *   context: {
 *     conversationHistory?: string[];
 *     senderName: string;
 *     relationship?: string;
 *   };
 *   tone?: 'formal' | 'casual' | 'concise' | 'friendly' | 'professional';
 *   generateAlternatives?: boolean;
 * }
 */
replyRouter.post('/suggest', async (req, res) => {
  try {
    const { messageContent, context, tone, generateAlternatives } = req.body;
    const autoReplyService = req.app.locals.autoReplyService;

    if (!messageContent || !context) {
      return res.status(400).json({
        success: false,
        error: 'messageContent and context required',
      });
    }

    const draft = await autoReplyService.suggestReply(
      messageContent,
      context,
      tone || 'professional',
      generateAlternatives !== false
    );

    res.json({
      success: true,
      draft,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get quick reply suggestions
 * POST /api/reply/quick
 * 
 * Body: { messageContent: string }
 */
replyRouter.post('/quick', async (req, res) => {
  try {
    const { messageContent } = req.body;
    const autoReplyService = req.app.locals.autoReplyService;

    if (!messageContent) {
      return res.status(400).json({
        success: false,
        error: 'messageContent required',
      });
    }

    const quickReplies = await autoReplyService.suggestQuickReply(messageContent);

    res.json({
      success: true,
      quickReplies,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Approve and send reply
 * POST /api/reply/send
 * 
 * Body: {
 *   draftId: string;
 *   approved: boolean;
 *   modifiedContent?: string;
 *   feedback?: string;
 *   roomId: string;
 * }
 */
replyRouter.post('/send', async (req, res) => {
  try {
    const { draftId, approved, modifiedContent, feedback, roomId } = req.body;
    const autoReplyService = req.app.locals.autoReplyService;
    const matrixService = req.app.locals.matrixService;

    if (!draftId || approved === undefined || !roomId) {
      return res.status(400).json({
        success: false,
        error: 'draftId, approved, and roomId required',
      });
    }

    const result = await autoReplyService.approveAndSend(
      { draftId, approved, modifiedContent, feedback },
      roomId,
      async (room: string, message: string) => {
        await matrixService.sendMessage(room, message);
      }
    );

    res.json(result);
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get pending drafts
 * GET /api/reply/drafts
 */
replyRouter.get('/drafts', async (req, res) => {
  try {
    const autoReplyService = req.app.locals.autoReplyService;
    const drafts = autoReplyService.getPendingDrafts();

    res.json({
      success: true,
      drafts,
      count: drafts.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Cancel draft
 * DELETE /api/reply/drafts/:draftId
 */
replyRouter.delete('/drafts/:draftId', async (req, res) => {
  try {
    const { draftId } = req.params;
    const autoReplyService = req.app.locals.autoReplyService;

    const cancelled = autoReplyService.cancelDraft(draftId);

    res.json({
      success: cancelled,
      message: cancelled ? 'Draft cancelled' : 'Draft not found',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
