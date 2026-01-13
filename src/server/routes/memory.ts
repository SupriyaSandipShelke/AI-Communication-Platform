import { Router } from 'express';

export const memoryRouter = Router();

/**
 * Query memories
 * POST /api/memory/query
 * 
 * Body: {
 *   question: string;
 *   type?: 'decision' | 'commitment' | 'promise' | 'task' | 'fact' | 'preference';
 *   timeframe?: 'today' | 'week' | 'month' | 'all';
 *   limit?: number;
 * }
 */
memoryRouter.post('/query', async (req, res) => {
  try {
    const { question, type, timeframe, limit } = req.body;
    const memoryVault = req.app.locals.memoryVault;

    if (!question) {
      return res.status(400).json({
        success: false,
        error: 'question required',
      });
    }

    const result = await memoryVault.queryMemories({
      question,
      type,
      timeframe,
      limit,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get open commitments
 * GET /api/memory/commitments
 */
memoryRouter.get('/commitments', async (req, res) => {
  try {
    const memoryVault = req.app.locals.memoryVault;
    const userId = (req as any).user?.id;

    const commitments = await memoryVault.getOpenCommitments(userId);

    res.json({
      success: true,
      commitments,
      count: commitments.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Complete memory/commitment
 * POST /api/memory/:memoryId/complete
 */
memoryRouter.post('/:memoryId/complete', async (req, res) => {
  try {
    const { memoryId } = req.params;
    const memoryVault = req.app.locals.memoryVault;

    const completed = await memoryVault.completeMemory(memoryId);

    res.json({
      success: completed,
      message: completed ? 'Memory marked as completed' : 'Memory not found',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update memory
 * PATCH /api/memory/:memoryId
 * 
 * Body: { ... partial memory fields ... }
 */
memoryRouter.patch('/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    const updates = req.body;
    const memoryVault = req.app.locals.memoryVault;

    const updated = await memoryVault.updateMemory(memoryId, updates);

    res.json({
      success: updated,
      message: updated ? 'Memory updated' : 'Memory not found',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Delete memory
 * DELETE /api/memory/:memoryId
 */
memoryRouter.delete('/:memoryId', async (req, res) => {
  try {
    const { memoryId } = req.params;
    const memoryVault = req.app.locals.memoryVault;

    const deleted = await memoryVault.deleteMemory(memoryId);

    res.json({
      success: deleted,
      message: deleted ? 'Memory deleted' : 'Memory not found',
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get memory statistics
 * GET /api/memory/stats
 */
memoryRouter.get('/stats', async (req, res) => {
  try {
    const memoryVault = req.app.locals.memoryVault;

    const stats = memoryVault.getStatistics();

    res.json({
      success: true,
      statistics: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Extract memories from message
 * POST /api/memory/extract
 * 
 * Body: {
 *   content: string;
 *   sender: string;
 *   roomId: string;
 *   platform: string;
 *   messageId: string;
 * }
 */
memoryRouter.post('/extract', async (req, res) => {
  try {
    const { content, sender, roomId, platform, messageId } = req.body;
    const memoryVault = req.app.locals.memoryVault;

    if (!content || !sender || !roomId || !platform || !messageId) {
      return res.status(400).json({
        success: false,
        error: 'All fields required: content, sender, roomId, platform, messageId',
      });
    }

    const memories = await memoryVault.extractMemories(
      content,
      sender,
      roomId,
      platform,
      messageId
    );

    res.json({
      success: true,
      memories,
      count: memories.length,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});
