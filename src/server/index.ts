import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import { MatrixService } from './services/MatrixService.js';
import { AIService } from './services/AIService.js';
import { DatabaseService } from './services/DatabaseService.js';
import { VectorSearchService } from './services/VectorSearchService.js';
import { PriorityEngineService } from './services/PriorityEngineService.js';
import { AutoReplyService } from './services/AutoReplyService.js';
import { VoiceCommandService } from './services/VoiceCommandService.js';
import { AIMemoryVaultService } from './services/AIMemoryVaultService.js';
import { GroupService } from './services/GroupService.js';
import { GroupAIService } from './services/GroupAIService.js';
import { ScheduledSummariesService } from './services/ScheduledSummariesService.js';
import { NotificationService } from './services/NotificationService.js';
import { WebRTCSignalingService } from './services/WebRTCSignalingService.js';
import { messageRouter } from './routes/messages.js';
import { authRouter } from './routes/auth.js';
import { analyticsRouter } from './routes/analytics.js';
import { priorityRouter } from './routes/priority.js';
import { replyRouter } from './routes/reply.js';
import { voiceRouter } from './routes/voice.js';
import { memoryRouter } from './routes/memory.js';
import { groupsRouter } from './routes/groups.js';
import { themeRouter } from './routes/theme.js';
import { chatRouter } from './routes/chat.js';
import { scheduledSummariesRouter } from './routes/scheduledSummaries.js';
import { whatsappChatRouter } from './routes/whatsappChat.js';
import { whatsappFeaturesRouter } from './routes/whatsappFeatures.js';

dotenv.config();

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:5173'],
  credentials: true
}));
app.use(express.json());

// Initialize services
const dbService = new DatabaseService();
const aiService = new AIService();
const matrixService = new MatrixService();
const vectorSearchService = new VectorSearchService(dbService);
const priorityEngine = new PriorityEngineService(dbService);
const autoReplyService = new AutoReplyService(dbService);
const memoryVault = new AIMemoryVaultService(dbService, vectorSearchService);
const voiceService = new VoiceCommandService(
  dbService,
  aiService,
  vectorSearchService,
  autoReplyService
);
const groupService = new GroupService(matrixService, dbService);
const groupAIService = new GroupAIService(groupService, dbService, memoryVault);
const scheduledSummariesService = new ScheduledSummariesService(aiService, dbService, vectorSearchService);
const notificationService = new NotificationService(dbService);
const webrtcSignaling = new WebRTCSignalingService();

// Make services available globally
app.locals.dbService = dbService;
app.locals.aiService = aiService;
app.locals.matrixService = matrixService;
app.locals.vectorSearchService = vectorSearchService;
app.locals.priorityEngine = priorityEngine;
app.locals.autoReplyService = autoReplyService;
app.locals.voiceService = voiceService;
app.locals.memoryVault = memoryVault;
app.locals.groupService = groupService;
app.locals.groupAIService = groupAIService;
app.locals.scheduledSummariesService = scheduledSummariesService;
app.locals.notificationService = notificationService;
app.locals.webrtcSignaling = webrtcSignaling;
app.locals.wss = wss;

// Routes
app.use('/api/auth', authRouter);
app.use('/api/messages', messageRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/priority', priorityRouter);
app.use('/api/reply', replyRouter);
app.use('/api/voice', voiceRouter);
app.use('/api/memory', memoryRouter);
app.use('/api/groups', groupsRouter);
app.use('/api/user', themeRouter);
app.use('/api/chat', chatRouter);
app.use('/api/summaries', scheduledSummariesRouter);
app.use('/api/whatsapp', whatsappChatRouter);
app.use('/api/whatsapp', whatsappFeaturesRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    services: {
      matrix: matrixService.isConnected(),
      database: true,
      ai: aiService.isConfigured()
    }
  });
});

// Enhanced WebSocket connection handling with full WhatsApp features
const connectedUsers = new Map<string, any>(); // userId -> WebSocket connection
const userRooms = new Map<string, Set<string>>(); // userId -> Set of roomIds
const typingUsers = new Map<string, Set<string>>(); // roomId -> Set of userIds

wss.on('connection', (ws) => {
  console.log('New WebSocket client connected');
  let userId: string | null = null;

  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'authenticate':
          userId = message.userId as string;
          if (!userId || typeof userId !== 'string') {
            ws.send(JSON.stringify({ type: 'error', message: 'Invalid user ID' }));
            break;
          }
          
          const authenticatedUserId: string = userId;
          connectedUsers.set(authenticatedUserId, ws);
          
          // Store userId on the WebSocket connection for easy access
          (ws as any).userId = authenticatedUserId;
          
          // Get user's chats (including groups) and subscribe to them
          try {
            const userChats = await dbService.getChats(authenticatedUserId);
            const roomIds = userChats.map(chat => chat.id);
            userRooms.set(authenticatedUserId, new Set(roomIds));
          } catch (error) {
            console.error('Failed to load user chats:', error);
            userRooms.set(authenticatedUserId, new Set(message.rooms || []));
          }
          
          // Register with WebRTC signaling service
          webrtcSignaling.setUserConnection(authenticatedUserId, ws);
          
          // Broadcast user online status
          broadcastToRooms(authenticatedUserId, {
            type: 'user_online',
            userId: authenticatedUserId,
            timestamp: new Date()
          });
          
          ws.send(JSON.stringify({ type: 'authenticated', userId: authenticatedUserId }));
          break;

        case 'send_message':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const sendMessageUserId = userId; // Capture for type safety
          let actualRoomId = message.roomId;
          
          // Handle individual user chats
          if (message.roomId.startsWith('user_')) {
            const contactId = message.roomId.replace('user_', '');
            try {
              actualRoomId = await dbService.getOrCreateIndividualChat(message.sender || sendMessageUserId, contactId);
            } catch (error) {
              console.error('Failed to create individual chat:', error);
              ws.send(JSON.stringify({ type: 'error', message: 'Failed to create chat' }));
              break;
            }
          }
          
          const messageId = await dbService.saveMessage({
            platform: 'websocket',
            roomId: actualRoomId,
            sender: message.sender || sendMessageUserId,
            content: message.content,
            timestamp: new Date(),
            userId: message.sender || sendMessageUserId
          });

          // Set message status as sent
          await dbService.setMessageStatus(messageId, message.sender || sendMessageUserId, 'sent');

          // Get sender information
          const senderInfo = await dbService.getUserById(message.sender || sendMessageUserId);
          
          // Broadcast message to room participants
          const messageData = {
            type: 'new_message',
            platform: 'websocket',
            message: {
              id: messageId,
              roomId: actualRoomId,
              sender: message.sender || sendMessageUserId,
              senderName: senderInfo?.username || message.senderName || 'Unknown',
              content: message.content,
              timestamp: new Date(),
              status: 'sent',
              type: message.type || 'text',
              isOwn: false // Will be set correctly on client side
            }
          };

          // For group messages, broadcast to all group members
          if (message.isGroup) {
            try {
              const groupMembers = await new Promise<Array<{ user_id: string }>>((resolve, reject) => {
                if (!dbService.db) {
                  reject(new Error('Database not initialized'));
                  return;
                }
                dbService.db.all(
                  'SELECT user_id FROM chat_participants WHERE chat_id = ?',
                  [actualRoomId],
                  (err, result: Array<{ user_id: string }>) => {
                    if (err) reject(err);
                    else resolve(result);
                  }
                );
              });

              // Broadcast to all group members
              groupMembers.forEach((member) => {
                const memberWs = connectedUsers.get(member.user_id);
                if (memberWs && memberWs.readyState === 1) {
                  // Set isOwn flag correctly for each recipient
                  const personalizedMessage = {
                    ...messageData,
                    message: {
                      ...messageData.message,
                      isOwn: member.user_id === (message.sender || sendMessageUserId)
                    }
                  };
                  memberWs.send(JSON.stringify(personalizedMessage));
                }
              });
            } catch (error) {
              console.error('Failed to broadcast to group members:', error);
              // Fallback to room-based broadcast
              broadcastToRoom(actualRoomId, messageData);
            }
          } else {
            // For individual chats, broadcast to both participants
            try {
              const chat = await dbService.getChat(actualRoomId, message.sender || sendMessageUserId);
              if (chat) {
                const participants = [chat.user_id, chat.contact_id];
                participants.forEach(participantId => {
                  const participantWs = connectedUsers.get(participantId);
                  if (participantWs && participantWs.readyState === 1) {
                    const personalizedMessage = {
                      ...messageData,
                      message: {
                        ...messageData.message,
                        isOwn: participantId === (message.sender || sendMessageUserId)
                      }
                    };
                    participantWs.send(JSON.stringify(personalizedMessage));
                  }
                });
              }
            } catch (error) {
              console.error('Failed to broadcast to individual chat participants:', error);
              broadcastToRoom(actualRoomId, messageData);
            }
          }
          
          // Mark as delivered for online users after a short delay
          setTimeout(async () => {
            await dbService.setMessageStatus(messageId, message.sender || sendMessageUserId, 'delivered');
            
            const deliveryUpdate = {
              type: 'message_status',
              messageId,
              status: 'delivered'
            };
            
            if (message.isGroup) {
              // Broadcast delivery status to group members
              try {
                const groupMembers = await new Promise<Array<{ user_id: string }>>((resolve, reject) => {
                  if (!dbService.db) {
                    reject(new Error('Database not initialized'));
                    return;
                  }
                  dbService.db.all(
                    'SELECT user_id FROM chat_participants WHERE chat_id = ?',
                    [actualRoomId],
                    (err, result: Array<{ user_id: string }>) => {
                      if (err) reject(err);
                      else resolve(result);
                    }
                  );
                });

                groupMembers.forEach((member) => {
                  const memberWs = connectedUsers.get(member.user_id);
                  if (memberWs && memberWs.readyState === 1) {
                    memberWs.send(JSON.stringify(deliveryUpdate));
                  }
                });
              } catch (error) {
                console.error('Failed to broadcast delivery status:', error);
                broadcastToRoom(actualRoomId, deliveryUpdate);
              }
            } else {
              broadcastToRoom(actualRoomId, deliveryUpdate);
            }
          }, 100);
          break;

        case 'typing_start':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const typingStartUserId = userId; // Capture for type safety
          
          if (!typingUsers.has(message.roomId)) {
            typingUsers.set(message.roomId, new Set());
          }
          typingUsers.get(message.roomId)!.add(typingStartUserId);
          
          // For group chats, broadcast to all members except sender
          if (message.isGroup) {
            try {
              const groupMembers = await new Promise<Array<{ user_id: string }>>((resolve, reject) => {
                if (!dbService.db) {
                  reject(new Error('Database not initialized'));
                  return;
                }
                dbService.db.all(
                  'SELECT user_id FROM chat_participants WHERE chat_id = ?',
                  [message.roomId],
                  (err, result: Array<{ user_id: string }>) => {
                    if (err) reject(err);
                    else resolve(result);
                  }
                );
              });

              const typingMessage = {
                type: 'typing_start',
                roomId: message.roomId,
                userId: typingStartUserId,
                timestamp: new Date()
              };

              groupMembers.forEach((member) => {
                if (member.user_id !== typingStartUserId) {
                  const memberWs = connectedUsers.get(member.user_id);
                  if (memberWs && memberWs.readyState === 1) {
                    memberWs.send(JSON.stringify(typingMessage));
                  }
                }
              });
            } catch (error) {
              console.error('Failed to broadcast typing indicator:', error);
              broadcastToRoom(message.roomId, {
                type: 'typing_start',
                roomId: message.roomId,
                userId: typingStartUserId,
                timestamp: new Date()
              }, typingStartUserId);
            }
          } else {
            broadcastToRoom(message.roomId, {
              type: 'typing_start',
              roomId: message.roomId,
              userId: typingStartUserId,
              timestamp: new Date()
            }, typingStartUserId);
          }
          break;

        case 'typing_stop':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const typingStopUserId = userId; // Capture for type safety
          
          if (typingUsers.has(message.roomId)) {
            typingUsers.get(message.roomId)!.delete(typingStopUserId);
          }
          
          // For group chats, broadcast to all members except sender
          if (message.isGroup) {
            try {
              const groupMembers = await new Promise<Array<{ user_id: string }>>((resolve, reject) => {
                if (!dbService.db) {
                  reject(new Error('Database not initialized'));
                  return;
                }
                dbService.db.all(
                  'SELECT user_id FROM chat_participants WHERE chat_id = ?',
                  [message.roomId],
                  (err, result: Array<{ user_id: string }>) => {
                    if (err) reject(err);
                    else resolve(result);
                  }
                );
              });

              const typingMessage = {
                type: 'typing_stop',
                roomId: message.roomId,
                userId: typingStopUserId,
                timestamp: new Date()
              };

              groupMembers.forEach((member) => {
                if (member.user_id !== typingStopUserId) {
                  const memberWs = connectedUsers.get(member.user_id);
                  if (memberWs && memberWs.readyState === 1) {
                    memberWs.send(JSON.stringify(typingMessage));
                  }
                }
              });
            } catch (error) {
              console.error('Failed to broadcast typing stop:', error);
              broadcastToRoom(message.roomId, {
                type: 'typing_stop',
                roomId: message.roomId,
                userId: typingStopUserId,
                timestamp: new Date()
              }, typingStopUserId);
            }
          } else {
            broadcastToRoom(message.roomId, {
              type: 'typing_stop',
              roomId: message.roomId,
              userId: typingStopUserId,
              timestamp: new Date()
            }, typingStopUserId);
          }
          break;

        case 'message_read':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const messageReadUserId = userId; // Capture for type safety
          await dbService.setMessageStatus(message.messageId, messageReadUserId, 'read');
          
          broadcastToRoom(message.roomId, {
            type: 'message_status',
            messageId: message.messageId,
            status: 'read',
            readBy: messageReadUserId
          });
          break;

        case 'join_room':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const joinRoomUserId = userId; // Capture for type safety
          if (!userRooms.has(joinRoomUserId)) {
            userRooms.set(joinRoomUserId, new Set());
          }
          userRooms.get(joinRoomUserId)!.add(message.roomId);
          break;

        case 'leave_room':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const leaveRoomUserId = userId; // Capture for type safety
          if (userRooms.has(leaveRoomUserId)) {
            userRooms.get(leaveRoomUserId)!.delete(message.roomId);
          }
          break;

        case 'initiate_call':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const initiateCallUserId = userId; // Capture for type safety
          const callData = {
            id: `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            callerId: initiateCallUserId,
            calleeId: message.calleeId,
            callType: (message.callType || 'audio') as 'audio' | 'video',
            status: 'initiated' as const
          };

          await dbService.createCall(callData);
          
          // Use WebRTC signaling service
          try {
            await webrtcSignaling.initiateCall(callData.id, initiateCallUserId, message.calleeId, message.callType);
          } catch (error) {
            console.error('Failed to initiate WebRTC call:', error);
          }
          break;

        case 'accept_call':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const acceptCallUserId = userId; // Capture for type safety
          try {
            await webrtcSignaling.acceptCall(message.callId, acceptCallUserId);
            await dbService.updateCallStatus(message.callId, 'connected');
          } catch (error) {
            console.error('Failed to accept call:', error);
          }
          break;

        case 'reject_call':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const rejectCallUserId = userId; // Capture for type safety
          try {
            await webrtcSignaling.rejectCall(message.callId, rejectCallUserId);
            await dbService.updateCallStatus(message.callId, 'rejected');
          } catch (error) {
            console.error('Failed to reject call:', error);
          }
          break;

        case 'end_call':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const endCallUserId = userId; // Capture for type safety
          try {
            const result = await webrtcSignaling.endCall(message.callId, endCallUserId);
            if (result) {
              await dbService.updateCallStatus(message.callId, 'ended', message.duration || result.duration);
            }
          } catch (error) {
            console.error('Failed to end call:', error);
          }
          break;

        // WebRTC Signaling
        case 'webrtc_offer':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const offerUserId = userId; // Capture for type safety
          try {
            await webrtcSignaling.handleOffer(message.callId, offerUserId, message.offer);
          } catch (error) {
            console.error('Failed to handle WebRTC offer:', error);
          }
          break;

        case 'webrtc_answer':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const answerUserId = userId; // Capture for type safety
          try {
            await webrtcSignaling.handleAnswer(message.callId, answerUserId, message.answer);
          } catch (error) {
            console.error('Failed to handle WebRTC answer:', error);
          }
          break;

        case 'webrtc_ice_candidate':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const iceCandidateUserId = userId; // Capture for type safety
          try {
            await webrtcSignaling.handleIceCandidate(message.callId, iceCandidateUserId, message.candidate);
          } catch (error) {
            console.error('Failed to handle ICE candidate:', error);
          }
          break;

        case 'subscribe':
          if (!userId) {
            ws.send(JSON.stringify({ type: 'error', message: 'Not authenticated' }));
            break;
          }
          
          const subscribeUserId = userId; // Capture for type safety
          // Subscribe to specific channels/rooms
          if (!userRooms.has(subscribeUserId)) {
            userRooms.set(subscribeUserId, new Set());
          }
          userRooms.get(subscribeUserId)!.add(message.roomId);
          ws.send(JSON.stringify({ type: 'subscribed', roomId: message.roomId }));
          break;

        default:
          // Handle Matrix messages
          if (message.type === 'send_message') {
            await matrixService.sendMessage(message.roomId, message.content);
          }
          break;
      }
    } catch (error) {
      console.error('WebSocket error:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });
  
  ws.on('close', () => {
    if (userId) {
      const disconnectedUserId = userId;
      connectedUsers.delete(disconnectedUserId);
      userRooms.delete(disconnectedUserId);
      
      // Remove from WebRTC signaling service
      webrtcSignaling.removeUserConnection(disconnectedUserId);
      
      // Clean up typing indicators
      typingUsers.forEach((users, roomId) => {
        if (users.has(disconnectedUserId)) {
          users.delete(disconnectedUserId);
          broadcastToRoom(roomId, {
            type: 'typing_indicator',
            roomId,
            userId: disconnectedUserId,
            isTyping: false
          });
        }
      });

      // Broadcast user offline status
      broadcastToRooms(disconnectedUserId, {
        type: 'user_offline',
        userId: disconnectedUserId,
        timestamp: new Date()
      });
    }
    console.log('Client disconnected');
  });
});

// Helper functions for broadcasting
function broadcastToRoom(roomId: string, message: any, excludeUserId: string | null = null) {
  connectedUsers.forEach((ws, userId: string) => {
    if (userId !== excludeUserId && userRooms.get(userId)?.has(roomId) && ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  });
}

function broadcastToRooms(userId: string, message: any) {
  const rooms = userRooms.get(userId);
  if (rooms) {
    rooms.forEach(roomId => {
      broadcastToRoom(roomId, message, userId);
    });
  }
}

function broadcastToAll(message: any, excludeUserId: string | null = null) {
  connectedUsers.forEach((ws, userId: string) => {
    if (userId !== excludeUserId && ws.readyState === 1) {
      ws.send(JSON.stringify(message));
    }
  });
}

// Initialize services and start server
async function startServer() {
  try {
    // Initialize database
    await dbService.initialize();
    console.log('✅ Database initialized');
    
    // Initialize Matrix client (non-blocking)
    matrixService.initialize().then(() => {
      console.log('✅ Matrix client connected');
    }).catch((err) => {
      console.warn('⚠️  Matrix client running in demo mode:', err.message);
    });
    
    // Setup Matrix message listener
    matrixService.onMessage(async (event) => {
      // Store message in database
      await dbService.saveMessage({
        platform: 'matrix',
        roomId: event.getRoomId(),
        sender: event.getSender(),
        content: event.getContent().body,
        timestamp: event.getDate()
      });
      
      // Broadcast to all WebSocket clients
      wss.clients.forEach((client) => {
        if (client.readyState === 1) {
          client.send(JSON.stringify({
            type: 'new_message',
            platform: 'matrix',
            message: event.getContent()
          }));
        }
      });
      
      // AI processing for priority tagging
      if (process.env.ENABLE_AI_SUMMARY === 'true') {
        const priority = await aiService.classifyPriority(event.getContent().body);
        await dbService.updateMessagePriority(event.getId(), priority);
        
        // Auto-respond if needed
        if (process.env.ENABLE_AUTO_RESPONSE === 'true' && priority === 'high') {
          const autoResponse = await aiService.generateAutoResponse(event.getContent().body);
          if (autoResponse.shouldRespond && autoResponse.message) {
            await matrixService.sendMessage(event.getRoomId(), autoResponse.message);
          }
        }
      }
    });
    
    const startServerOnPort = (port: number) => {
      server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
          console.log(`⚠️  Port ${port} is busy, trying another...`);
          setTimeout(() => {
            // Remove the old error listener to avoid duplicates
            server.removeAllListeners('error');
            startServerOnPort(port + 1);
          }, 1000);
        } else {
          console.error('❌ Server error:', err);
          process.exit(1);
        }
      });
      
      server.listen(port, () => {
        const addr = server.address();
        const portNumber = typeof addr === 'string' ? addr : addr?.port;
        console.log(`🚀 Server running on port ${portNumber}`);
        console.log(`📡 WebSocket server ready`);
      });
    };
    
    startServerOnPort(parseInt(process.env.PORT || '3001'));
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
