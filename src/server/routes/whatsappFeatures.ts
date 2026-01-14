import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

export const whatsappFeaturesRouter = Router();

// Configure multer for file uploads (for group profile pictures and backgrounds)
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = './uploads/groups';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB limit
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only images are allowed'));
    }
  }
});

// Apply authentication middleware to all routes
whatsappFeaturesRouter.use(authenticateToken);

/**
 * Initiate a call
 * POST /api/whatsapp/call/initiate
 */
whatsappFeaturesRouter.post('/call/initiate', async (req, res) => {
  try {
    const { calleeId, callType = 'audio' } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!calleeId) {
      return res.status(400).json({ success: false, error: 'Callee ID is required' });
    }

    // Create call record
    const callId = await dbService.createCall({
      id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      callerId: userId,
      calleeId,
      callType,
      status: 'initiated'
    });

    // Update call status to ringing
    await dbService.updateCallStatus(callId, 'ringing');

    // Notify callee via WebSocket
    // This would be handled by the WebSocket server

    res.json({
      success: true,
      callId,
      message: 'Call initiated successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Accept a call
 * POST /api/whatsapp/call/:callId/accept
 */
whatsappFeaturesRouter.post('/call/:callId/accept', async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Verify user is the callee
    const call = await dbService.getCall(callId);
    if (!call || call.callee_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to accept this call' });
    }

    // Update call status to connected
    await dbService.updateCallStatus(callId, 'connected', new Date());

    // Notify participants via WebSocket
    // This would be handled by the WebSocket server

    res.json({
      success: true,
      message: 'Call accepted successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Reject a call
 * POST /api/whatsapp/call/:callId/reject
 */
whatsappFeaturesRouter.post('/call/:callId/reject', async (req, res) => {
  try {
    const { callId } = req.params;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Verify user is the callee
    const call = await dbService.getCall(callId);
    if (!call || call.callee_id !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to reject this call' });
    }

    // Update call status to rejected
    await dbService.updateCallStatus(callId, 'rejected', undefined, new Date());

    // Notify participants via WebSocket
    // This would be handled by the WebSocket server

    res.json({
      success: true,
      message: 'Call rejected successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * End a call
 * POST /api/whatsapp/call/:callId/end
 */
whatsappFeaturesRouter.post('/call/:callId/end', async (req, res) => {
  try {
    const { callId } = req.params;
    const { duration: providedDuration } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Verify user is part of the call
    const call = await dbService.getCall(callId);
    if (!call || (call.caller_id !== userId && call.callee_id !== userId)) {
      return res.status(403).json({ success: false, error: 'Not authorized to end this call' });
    }

    // Calculate duration if not already set
    const endTime = new Date();
    const duration = providedDuration || (call?.start_time ? 
      Math.floor((endTime.getTime() - new Date(call.start_time).getTime()) / 1000) : 
      0);

    // Update call status to ended
    await dbService.updateCallStatus(callId, 'ended', undefined, endTime, duration);

    // Notify participants via WebSocket
    // This would be handled by the WebSocket server

    res.json({
      success: true,
      message: 'Call ended successfully',
      duration
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get call history
 * GET /api/whatsapp/calls
 */
whatsappFeaturesRouter.get('/calls', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const { limit = 50, offset = 0 } = req.query;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const calls = await dbService.getUserCalls(userId, parseInt(limit as string), parseInt(offset as string));

    res.json({
      success: true,
      calls,
      count: calls.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * React to a message
 * POST /api/whatsapp/message/:messageId/react
 */
whatsappFeaturesRouter.post('/message/:messageId/react', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { emoji } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!emoji) {
      return res.status(400).json({ success: false, error: 'Emoji is required' });
    }

    await dbService.addMessageReaction(messageId, userId, emoji);

    res.json({
      success: true,
      message: 'Reaction added successfully'
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
 * PATCH /api/whatsapp/message/:messageId/edit
 */
whatsappFeaturesRouter.patch('/message/:messageId/edit', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { content } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!content) {
      return res.status(400).json({ success: false, error: 'Content is required' });
    }

    // Verify message ownership
    const message = await dbService.getMessage(messageId);
    if (!message || message.sender !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to edit this message' });
    }

    await dbService.editMessage(messageId, content);

    res.json({
      success: true,
      message: 'Message edited successfully'
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
 * DELETE /api/whatsapp/message/:messageId/delete
 */
whatsappFeaturesRouter.delete('/message/:messageId/delete', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { deleteForEveryone = false } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Verify message ownership
    const message = await dbService.getMessage(messageId);
    if (!message || message.sender !== userId) {
      return res.status(403).json({ success: false, error: 'Not authorized to delete this message' });
    }

    // Check if delete for everyone is allowed (within time limit)
    if (deleteForEveryone) {
      const messageTime = new Date(message.timestamp);
      const now = new Date();
      const timeDiff = now.getTime() - messageTime.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);

      if (hoursDiff > 1) { // 1 hour limit for delete for everyone
        return res.status(400).json({ 
          success: false, 
          error: 'Cannot delete for everyone after 1 hour' 
        });
      }
    }

    await dbService.deleteMessage(messageId, deleteForEveryone);

    res.json({
      success: true,
      message: deleteForEveryone ? 'Message deleted for everyone' : 'Message deleted for you'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Star/unstar a message
 * POST /api/whatsapp/message/:messageId/star
 */
whatsappFeaturesRouter.post('/message/:messageId/star', async (req, res) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const isStarred = await dbService.toggleMessageStar(messageId, userId);

    res.json({
      success: true,
      isStarred,
      message: isStarred ? 'Message starred' : 'Message unstarred'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Create WhatsApp group
 * POST /api/whatsapp/groups/create
 */
whatsappFeaturesRouter.post('/groups/create', async (req, res) => {
  try {
    const { name, participants = [], description } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;
    const wss = req.app.locals.wss;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!name || !name.trim()) {
      return res.status(400).json({ 
        success: false, 
        error: 'Group name is required' 
      });
    }

    // Create group in database
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const groupData = {
      id: groupId,
      name: name.trim(),
      description: description?.trim() || '',
      creatorId: userId,
      isGroup: true,
      participants: [userId, ...participants], // Creator is always included
      createdAt: new Date()
    };

    await dbService.createWhatsAppGroup(groupData);

    // Notify all participants via WebSocket about the new group
    if (wss) {
      const groupNotification = {
        type: 'group_created',
        groupId,
        groupName: name.trim(),
        creatorId: userId,
        participants: groupData.participants,
        timestamp: new Date()
      };

      // Broadcast to all participants
      wss.clients.forEach((client: any) => {
        if (client.readyState === 1 && client.userId && groupData.participants.includes(client.userId)) {
          client.send(JSON.stringify(groupNotification));
        }
      });
    }

    res.json({
      success: true,
      groupId,
      message: 'Group created successfully'
    });
  } catch (error: any) {
    console.error('Group creation error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get user's WhatsApp groups
 * GET /api/whatsapp/groups
 */
whatsappFeaturesRouter.get('/groups', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const groups = await dbService.getUserWhatsAppGroups(userId);

    res.json({
      success: true,
      groups,
      count: groups.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get all available groups (for joining)
 * GET /api/whatsapp/groups/available
 */
whatsappFeaturesRouter.get('/groups/available', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Get all groups that exist
    const groupsResult = await new Promise((resolve, reject) => {
      dbService.db.all(
        `SELECT c.*, 
                COUNT(cp.user_id) as member_count,
                GROUP_CONCAT(u.username) as member_names,
                CASE WHEN EXISTS(
                  SELECT 1 FROM chat_participants cp2 
                  WHERE cp2.chat_id = c.id AND cp2.user_id = ?
                ) THEN 1 ELSE 0 END as is_member
         FROM chats c
         LEFT JOIN chat_participants cp ON c.id = cp.chat_id
         LEFT JOIN users u ON cp.user_id = u.id
         WHERE c.is_group = 1
         GROUP BY c.id
         ORDER BY c.updated_at DESC`,
        [userId],
        (err: Error | null, result: any) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const allGroups = groupsResult as any[];
    res.json({
      success: true,
      groups: allGroups,
      count: allGroups.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Get group members
 * GET /api/whatsapp/groups/:groupId/members
 */
whatsappFeaturesRouter.get('/groups/:groupId/members', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check if user is a member of the group
    const isMember = await new Promise((resolve, reject) => {
      dbService.db.get(
        'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?',
        [groupId, userId],
        (err: Error | null, result: any) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (!isMember) {
      return res.status(403).json({ success: false, error: 'Not a member of this group' });
    }

    // Get group members
    const membersResult = await new Promise((resolve, reject) => {
      dbService.db.all(
        `SELECT cp.user_id, cp.role, cp.joined_at, u.username, u.created_at as user_created_at
         FROM chat_participants cp
         JOIN users u ON cp.user_id = u.id
         WHERE cp.chat_id = ?
         ORDER BY cp.role DESC, cp.joined_at ASC`,
        [groupId],
        (err: Error | null, result: any) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    const members = membersResult as any[];
    res.json({
      success: true,
      members,
      count: members.length
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Join a group
 * POST /api/whatsapp/groups/:groupId/join
 */
whatsappFeaturesRouter.post('/groups/:groupId/join', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check if group exists
    const group = await dbService.getChat(groupId, userId);
    if (!group && !group?.is_group) {
      // Try to get group info without user check
      const groupInfo = await new Promise((resolve, reject) => {
        dbService.db.get(
          'SELECT * FROM chats WHERE id = ? AND is_group = 1',
          [groupId],
          (err: Error | null, result: any) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
      
      if (!groupInfo) {
        return res.status(404).json({ success: false, error: 'Group not found' });
      }
    }

    // Check if user is already a member
    const existingMember = await new Promise((resolve, reject) => {
      dbService.db.get(
        'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?',
        [groupId, userId],
        (err: Error | null, result: any) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (existingMember) {
      return res.status(400).json({ success: false, error: 'Already a member of this group' });
    }

    // Add user to group
    const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise((resolve, reject) => {
      dbService.db.run(
        'INSERT INTO chat_participants (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)',
        [participantId, groupId, userId, 'member', new Date().toISOString()],
        (err: Error | null) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    res.json({
      success: true,
      message: 'Successfully joined the group'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Add member to WhatsApp group
 * POST /api/whatsapp/groups/:groupId/members/add
 */
whatsappFeaturesRouter.post('/groups/:groupId/members/add', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!memberId) {
      return res.status(400).json({ success: false, error: 'Member ID is required' });
    }

    await dbService.addWhatsAppGroupMember(groupId, userId, memberId);

    res.json({
      success: true,
      message: 'Member added to group successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Remove member from WhatsApp group
 * POST /api/whatsapp/groups/:groupId/members/remove
 */
whatsappFeaturesRouter.post('/groups/:groupId/members/remove', async (req, res) => {
  try {
    const { groupId } = req.params;
    const { memberId } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    if (!memberId) {
      return res.status(400).json({ success: false, error: 'Member ID is required' });
    }

    await dbService.removeWhatsAppGroupMember(groupId, userId, memberId);

    res.json({
      success: true,
      message: 'Member removed from group successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Update group profile
 * PUT /api/whatsapp/groups/:groupId/profile
 */
whatsappFeaturesRouter.put('/groups/:groupId/profile', upload.fields([
  { name: 'profilePicture', maxCount: 1 },
  { name: 'backgroundImage', maxCount: 1 }
]), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { name, description, backgroundColor } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    // Check if group exists and user is a member (not necessarily admin for basic updates)
    const group = await dbService.getChat(groupId, userId);
    if (!group) {
      return res.status(404).json({ success: false, error: 'Group not found' });
    }

    // For name changes, require admin privileges
    if (name && name !== group.group_name) {
      const isAdmin = await dbService.isGroupAdmin(groupId, userId);
      if (!isAdmin) {
        return res.status(403).json({ success: false, error: 'Only admins can change group name' });
      }
    }

    const updateData: any = {};
    if (name && name.trim()) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (backgroundColor) updateData.backgroundColor = backgroundColor;
    
    if (files?.profilePicture?.[0]) {
      updateData.profilePicture = `/uploads/groups/${files.profilePicture[0].filename}`;
    }
    
    if (files?.backgroundImage?.[0]) {
      updateData.backgroundImage = `/uploads/groups/${files.backgroundImage[0].filename}`;
    }

    await dbService.updateGroupProfile(groupId, updateData);

    res.json({
      success: true,
      message: 'Group profile updated successfully',
      updatedFields: Object.keys(updateData)
    });
  } catch (error: any) {
    console.error('Group profile update error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to update group profile',
    });
  }
});

/**
 * Exit group
 * POST /api/whatsapp/groups/:groupId/exit
 */
whatsappFeaturesRouter.post('/groups/:groupId/exit', async (req, res) => {
  try {
    const { groupId } = req.params;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    await dbService.removeWhatsAppGroupMember(groupId, userId, userId);

    res.json({
      success: true,
      message: 'Successfully left the group'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Mute/unmute chat notifications
 * POST /api/whatsapp/chat/:chatId/mute
 */
whatsappFeaturesRouter.post('/chat/:chatId/mute', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { muted } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    await dbService.setChatMuteStatus(chatId, userId, muted);

    res.json({
      success: true,
      message: muted ? 'Chat muted' : 'Chat unmuted'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Set disappearing messages
 * POST /api/whatsapp/chat/:chatId/disappearing
 */
whatsappFeaturesRouter.post('/chat/:chatId/disappearing', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { disappearingTime } = req.body;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    await dbService.setDisappearingMessages(chatId, disappearingTime);

    res.json({
      success: true,
      message: `Disappearing messages set to ${disappearingTime}`
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Clear chat
 * DELETE /api/whatsapp/chat/:chatId/clear
 */
whatsappFeaturesRouter.delete('/chat/:chatId/clear', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    await dbService.clearChatMessages(chatId, userId);

    res.json({
      success: true,
      message: 'Chat cleared successfully'
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

/**
 * Export chat
 * GET /api/whatsapp/chat/:chatId/export
 */
whatsappFeaturesRouter.get('/chat/:chatId/export', async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = (req as any).user?.id;
    const dbService = req.app.locals.dbService;

    if (!userId) {
      return res.status(401).json({ success: false, error: 'User not authenticated' });
    }

    const messages = await dbService.getChatMessages(chatId, userId);
    const chatInfo = await dbService.getChat(chatId, userId);
    
    let exportData = `Chat Export: ${chatInfo.name || 'Unknown'}\n`;
    exportData += `Exported on: ${new Date().toLocaleString()}\n`;
    exportData += `Total messages: ${messages.length}\n\n`;
    exportData += '--- Messages ---\n\n';
    
    messages.forEach((msg: any) => {
      const timestamp = new Date(msg.timestamp).toLocaleString();
      exportData += `[${timestamp}] ${msg.sender}: ${msg.content}\n`;
    });

    res.json({
      success: true,
      data: exportData
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default whatsappFeaturesRouter;