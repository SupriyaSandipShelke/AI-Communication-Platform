import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const chatRouter = Router();

// Apply authentication middleware to all routes
chatRouter.use(authenticateToken);

/**
 * Chat with the AI assistant
 * POST /api/chat/conversation
 * 
 * Body: {
 *   message: string;
 *   context?: {
 *     conversationId?: string;
 *     userId?: string;
 *     chatHistory?: Array<{role: 'user'|'assistant'; content: string}>;
 *   };
 * }
 */
chatRouter.post('/conversation', async (req, res) => {
  try {
    const { message, context } = req.body;
    const aiService = req.app.locals.aiService;
    const dbService = req.app.locals.dbService;

    if (!message) {
      return res.status(400).json({
        success: false,
        error: 'Message is required',
      });
    }

    // Get AI response
    const aiResponse = await aiService.converse(message, context);

    // Store the conversation in database for future context
    // Use authenticated user ID instead of context userId for security
    const userId = req.user?.id;
    if (userId) {
      await dbService.saveConversation({
        userId: userId,
        conversationId: context?.conversationId || `conv_${Date.now()}`,
        userMessage: message,
        aiResponse: aiResponse.response,
        timestamp: new Date()
      });
    }

    res.json({
      success: true,
      response: aiResponse.response,
      conversationId: aiResponse.conversationId,
      context: aiResponse.context
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get conversation history
 * GET /api/chat/history?userId&conversationId&limit
 */
chatRouter.get('/history', async (req, res) => {
  try {
    const { conversationId, limit = 50 } = req.query;
    const dbService = req.app.locals.dbService;
    
    // Use authenticated user ID instead of query parameter for security
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const history = await dbService.getConversationHistory({
      userId: userId,
      conversationId: conversationId as string,
      limit: parseInt(limit as string)
    });

    res.json({
      success: true,
      history,
      count: history.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Summarize current day's communications
 * POST /api/chat/summarize/day
 * 
 * Body: { userId?: string }
 */
chatRouter.post('/summarize/day', async (req, res) => {
  try {
    const aiService = req.app.locals.aiService;
    const dbService = req.app.locals.dbService;
    
    // Use authenticated user ID instead of body parameter for security
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Get today's messages
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const filters = {
      startDate: startOfDay,
      endDate: endOfDay,
      limit: 1000
    };

    const messages = await dbService.getMessages(filters);
    
    if (messages.length === 0) {
      return res.json({
        success: true,
        summary: "No messages found for today",
        keyTopics: [],
        sentiment: "neutral",
        actionItems: []
      });
    }

    const summary = await aiService.generateDailySummary(messages);

    res.json({
      success: true,
      summary: summary.summary,
      keyTopics: summary.keyTopics,
      sentiment: summary.sentiment,
      actionItems: summary.actionItems
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get priority inbox summary
 * GET /api/chat/priority/inbox
 */
chatRouter.get('/priority/inbox', async (req, res) => {
  try {
    const priorityEngine = req.app.locals.priorityEngine;
    const userId = (req as any).user?.id; // From auth middleware

    const inbox = await priorityEngine.getPriorityInbox(userId, 10);

    res.json({
      success: true,
      inbox,
      count: inbox.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Find information in AI memory vault
 * POST /api/chat/memory/search
 * 
 * Body: { query: string; userId?: string }
 */
chatRouter.post('/memory/search', async (req, res) => {
  try {
    const { query } = req.body;
    const memoryVault = req.app.locals.memoryVault;
    
    // Use authenticated user ID instead of body parameter for security
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }
    
    const results = await memoryVault.searchMemories(query, userId);

    res.json({
      success: true,
      results,
      count: results.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});