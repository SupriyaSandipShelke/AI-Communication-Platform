import * as sdk from 'matrix-js-sdk';

export class MatrixService {
  private client: any;
  private isReady: boolean = false;
  private messageHandlers: Array<(event: any) => void> = [];

  constructor() {
    this.client = null;
  }

  async initialize() {
    try {
      const homeserverUrl = process.env.MATRIX_HOMESERVER || 'https://matrix.org';
      const accessToken = process.env.MATRIX_ACCESS_TOKEN;
      const userId = process.env.MATRIX_USER_ID;

      if (!accessToken || !userId) {
        console.warn('⚠️  Matrix credentials not configured. Running in demo mode.');
        this.isReady = false;
        return;
      }

      // Create Matrix client
      this.client = sdk.createClient({
        baseUrl: homeserverUrl,
        accessToken: accessToken,
        userId: userId,
      });

      // Set up event listeners
      this.client.on('Room.timeline', (event: any, room: any, toStartOfTimeline: boolean) => {
        if (toStartOfTimeline) return;
        if (event.getType() !== 'm.room.message') return;
        if (event.getSender() === userId) return; // Ignore own messages

        // Trigger all registered handlers
        this.messageHandlers.forEach(handler => {
          try {
            handler(event);
          } catch (error) {
            console.error('Error in message handler:', error);
          }
        });
      });

      // Start the client
      await this.client.startClient({ initialSyncLimit: 10 });

      // Wait for sync to complete
      await new Promise((resolve) => {
        this.client.once('sync', (state: string) => {
          if (state === 'PREPARED') {
            this.isReady = true;
            resolve(true);
          }
        });
      });

      console.log('✅ Matrix client synchronized');
    } catch (error) {
      console.error('Failed to initialize Matrix client:', error);
      throw error;
    }
  }

  onMessage(handler: (event: any) => void) {
    this.messageHandlers.push(handler);
  }

  async sendMessage(roomId: string, content: string) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.sendTextMessage(roomId, content);
      return { success: true };
    } catch (error) {
      console.error('Failed to send message:', error);
      throw error;
    }
  }

  async getRooms() {
    if (!this.client || !this.isReady) {
      return [];
    }

    try {
      const rooms = this.client.getRooms();
      return rooms.map((room: any) => ({
        roomId: room.roomId,
        name: room.name,
        members: room.getJoinedMemberCount(),
        unreadCount: room.getUnreadNotificationCount(),
      }));
    } catch (error) {
      console.error('Failed to get rooms:', error);
      return [];
    }
  }

  async getMessages(roomId: string, limit: number = 50) {
    if (!this.client || !this.isReady) {
      return [];
    }

    try {
      const room = this.client.getRoom(roomId);
      if (!room) return [];

      const timeline = room.getLiveTimeline().getEvents();
      return timeline
        .filter((event: any) => event.getType() === 'm.room.message')
        .slice(-limit)
        .map((event: any) => ({
          id: event.getId(),
          sender: event.getSender(),
          content: event.getContent().body,
          timestamp: event.getDate(),
          type: event.getContent().msgtype,
        }));
    } catch (error) {
      console.error('Failed to get messages:', error);
      return [];
    }
  }

  async createRoom(config: any) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      const room = await this.client.createRoom(config);
      return { room_id: room.room_id };
    } catch (error) {
      console.error('Failed to create room:', error);
      throw error;
    }
  }

  async setRoomName(roomId: string, name: string) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.setRoomName(roomId, name);
    } catch (error) {
      console.error('Failed to set room name:', error);
      throw error;
    }
  }

  async setRoomTopic(roomId: string, topic: string) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.setRoomTopic(roomId, topic);
    } catch (error) {
      console.error('Failed to set room topic:', error);
      throw error;
    }
  }

  async setRoomAvatar(roomId: string, avatarUrl: string) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.setRoomAvatar(roomId, avatarUrl);
    } catch (error) {
      console.error('Failed to set room avatar:', error);
      throw error;
    }
  }

  async inviteToRoom(roomId: string, userId: string) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.invite(roomId, userId);
    } catch (error) {
      console.error('Failed to invite to room:', error);
      throw error;
    }
  }

  async kickFromRoom(roomId: string, userId: string, reason: string) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.kick(roomId, userId, reason);
    } catch (error) {
      console.error('Failed to kick from room:', error);
      throw error;
    }
  }

  async leaveRoom(roomId: string) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.leave(roomId);
    } catch (error) {
      console.error('Failed to leave room:', error);
      throw error;
    }
  }

  async joinRoom(roomIdOrAlias: string) {
    if (!this.client || !this.isReady) {
      throw new Error('Matrix client not initialized');
    }

    try {
      await this.client.joinRoom(roomIdOrAlias);
      return { success: true };
    } catch (error) {
      console.error('Failed to join room:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    return this.isReady && this.client !== null;
  }

  async stop() {
    if (this.client) {
      await this.client.stopClient();
      this.isReady = false;
    }
  }
}
