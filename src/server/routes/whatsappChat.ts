import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';

export const whatsappChatRouter = Router();

// Apply authentication middleware to all routes
whatsappChatRouter.use(authenticateToken);

/**
 * Get chat list for WhatsApp-like interface
 * GET /api/whatsapp/chats
 */
whatsappChatRouter.get('/chats', async (req, res) => {
  try {
    const dbService = req.app.locals.dbService;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const chats = await dbService.getChats(userId);

    res.json({
      success: true,
      chats,
      count: chats.length
    });
  } catch (error: any) {
    console.error('Error loading chats:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get chat messages
 * GET /api/whatsapp/chat/:chatId/messages
 */
whatsappChatRouter.get('/chat/:chatId/messages', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const dbService = req.app.locals.dbService;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check if user has access to this chat
    const chat = await dbService.getChat(chatId, userId);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    const messages = await dbService.getMessages({
      roomId: chatId,
      limit: parseInt(limit as string)
    });

    // Mark messages as read
    await dbService.markChatMessagesAsRead(chatId, userId);

    res.json({
      success: true,
      messages,
      count: messages.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Send a message
 * POST /api/whatsapp/chat/:chatId/send
 * 
 * Body: { content: string }
 */
whatsappChatRouter.post('/chat/:chatId/send', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { content } = req.body;
    const dbService = req.app.locals.dbService;
    const matrixService = req.app.locals.matrixService;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!content) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    // Check if user has access to this chat
    const chat = await dbService.getChat(chatId, userId);
    if (!chat) {
      return res.status(404).json({ success: false, error: 'Chat not found' });
    }

    // Save message to database
    const message = {
      platform: 'whatsapp',
      roomId: chatId,
      sender: userId,
      content,
      timestamp: new Date()
    };

    const messageId = await dbService.saveMessage(message);

    // Update chat's last message
    await dbService.updateChatLastMessage(chatId, content);

    // Send message through Matrix service (or other platform)
    try {
      await matrixService.sendMessage(chatId, content);
    } catch (matrixError: any) {
      console.warn('Failed to send message via Matrix:', matrixError.message);
    }

    // Set message status as sent
    await dbService.setMessageStatus(messageId, userId, 'sent');

    res.json({
      success: true,
      message: 'Message sent successfully',
      messageId
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Mark messages as read
 * POST /api/whatsapp/chat/:chatId/read
 * 
 * Body: { messageIds: string[] }
 */
whatsappChatRouter.post('/chat/:chatId/read', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { messageIds } = req.body;
    const dbService = req.app.locals.dbService;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Mark messages as read
    if (messageIds && Array.isArray(messageIds) && messageIds.length > 0) {
      for (const messageId of messageIds) {
        await dbService.setMessageStatus(messageId, userId, 'read');
      }
    } else {
      // Mark all messages in chat as read
      await dbService.markChatMessagesAsRead(chatId, userId);
    }

    res.json({
      success: true,
      message: 'Messages marked as read'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Set typing indicator
 * POST /api/whatsapp/chat/:chatId/typing
 * 
 * Body: { isTyping: boolean }
 */
whatsappChatRouter.post('/chat/:chatId/typing', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { isTyping } = req.body;
    const dbService = req.app.locals.dbService;
    const userId = req.user?.id;
    const wss = req.app.locals.wss;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Update typing status in database
    if (isTyping) {
      await dbService.setTypingStatus(chatId, userId, true);
    } else {
      await dbService.removeTypingStatus(chatId, userId);
    }

    // Broadcast typing status to other users in the chat
    if (wss) {
      const typingData = {
        type: 'typing_status',
        chatId,
        userId,
        isTyping,
        timestamp: new Date()
      };

      wss.clients.forEach((client: any) => {
        if (client.readyState === 1) { // WebSocket.OPEN
          client.send(JSON.stringify(typingData));
        }
      });
    }

    res.json({
      success: true,
      message: `Typing indicator ${isTyping ? 'started' : 'stopped'}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get typing indicators for a chat
 * GET /api/whatsapp/chat/:chatId/typing
 */
whatsappChatRouter.get('/chat/:chatId/typing', async (req, res) => {
  try {
    const { chatId } = req.params;
    const dbService = req.app.locals.dbService;

    const typingUsers = await dbService.getTypingStatus(chatId);

    res.json({
      success: true,
      typingUsers,
      count: typingUsers.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Create a new chat
 * POST /api/whatsapp/chat/create
 * 
 * Body: { contactId: string; initialMessage?: string }
 */
whatsappChatRouter.post('/chat/create', async (req, res) => {
  try {
    const { contactId, initialMessage } = req.body;
    const dbService = req.app.locals.dbService;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!contactId) {
      return res.status(400).json({ success: false, error: 'Contact ID is required' });
    }

    // Create a new chat
    const chatId = await dbService.createChat({
      userId,
      contactId,
      lastMessage: initialMessage || null
    });

    // If there's an initial message, save it
    if (initialMessage) {
      const message = {
        platform: 'whatsapp',
        roomId: chatId,
        sender: userId,
        content: initialMessage,
        timestamp: new Date()
      };

      const msgId = await dbService.saveMessage(message);
      await dbService.setMessageStatus(msgId, userId, 'sent');
    }

    res.json({
      success: true,
      message: 'Chat created successfully',
      chatId
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Delete a message
 * DELETE /api/whatsapp/messages/:messageId/delete
 * 
 * Body: { deleteForEveryone: boolean }
 */
whatsappChatRouter.delete('/messages/:messageId/delete', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    const dbService = req.app.locals.dbService;
    
    // Delete message from database
    await dbService.run('DELETE FROM messages WHERE id = ?', [messageId]);
    
    res.json({
      success: true,
      message: 'Message deleted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Edit a message
 * PUT /api/whatsapp/messages/:messageId/edit
 * 
 * Body: { content: string }
 */
whatsappChatRouter.put('/messages/:messageId/edit', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const dbService = req.app.locals.dbService;
    
    // Update message content in database
    await dbService.run('UPDATE messages SET content = ?, edited_at = CURRENT_TIMESTAMP WHERE id = ?', [content, messageId]);
    
    res.json({
      success: true,
      message: 'Message edited successfully',
      messageId
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default whatsappChatRouter;