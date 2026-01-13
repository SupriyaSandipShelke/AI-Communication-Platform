import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const messageRouter = Router();

// Apply authentication middleware to all routes
messageRouter.use(authenticateToken);

// Get all messages with filtering
messageRouter.get('/', async (req, res) => {
  try {
    const { platform, roomId, startDate, endDate, priority, limit = 100 } = req.query;
    const dbService = req.app.locals.dbService;

    const filters: any = { limit: parseInt(limit as string) };
    if (platform) filters.platform = platform;
    if (roomId) filters.roomId = roomId;
    if (startDate) filters.startDate = new Date(startDate as string);
    if (endDate) filters.endDate = new Date(endDate as string);
    if (priority) filters.priority = priority;

    const messages = await dbService.getMessages(filters);
    res.json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Send a message
messageRouter.post('/send', async (req, res) => {
  try {
    const { platform, roomId, content } = req.body;
    const matrixService = req.app.locals.matrixService;

    if (!content || !roomId) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    if (platform === 'matrix') {
      await matrixService.sendMessage(roomId, content);
    } else {
      return res.status(400).json({ success: false, error: 'Unsupported platform' });
    }

    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get daily summary
messageRouter.get('/summary/daily', async (req, res) => {
  try {
    const { date } = req.query;
    const dbService = req.app.locals.dbService;
    const aiService = req.app.locals.aiService;

    const targetDate = date ? new Date(date as string) : new Date();
    
    // Check if summary already exists
    let summary = await dbService.getDailySummary(targetDate);

    if (!summary) {
      // Generate new summary
      const startOfDay = new Date(targetDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(targetDate);
      endOfDay.setHours(23, 59, 59, 999);

      const messages = await dbService.getMessages({
        startDate: startOfDay,
        endDate: endOfDay
      });

      if (messages.length > 0) {
        const aiSummary = await aiService.generateDailySummary(messages);
        summary = { ...aiSummary, messageCount: messages.length };
        await dbService.saveDailySummary(targetDate, summary);
      }
    }

    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Mark message as read
messageRouter.patch('/:messageId/read', async (req, res) => {
  try {
    const { messageId } = req.params;
    const dbService = req.app.locals.dbService;

    await dbService.markAsRead(messageId);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Voice to text transcription
messageRouter.post('/transcribe', async (req, res) => {
  try {
    const aiService = req.app.locals.aiService;
    
    if (!req.body.audio) {
      return res.status(400).json({ success: false, error: 'No audio data provided' });
    }

    const audioBuffer = Buffer.from(req.body.audio, 'base64');
    const transcript = await aiService.transcribeAudio(audioBuffer);

    res.json({ success: true, transcript });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get Matrix rooms
messageRouter.get('/rooms', async (req, res) => {
  try {
    const matrixService = req.app.locals.matrixService;
    const rooms = await matrixService.getRooms();
    res.json({ success: true, rooms });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Get messages from specific room
messageRouter.get('/rooms/:roomId', async (req, res) => {
  try {
    const { roomId } = req.params;
    const { limit = 50 } = req.query;
    const matrixService = req.app.locals.matrixService;

    const messages = await matrixService.getMessages(roomId, parseInt(limit as string));
    res.json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});
