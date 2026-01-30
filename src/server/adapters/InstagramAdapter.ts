import { BasePlatformAdapter } from './PlatformAdapter.js';
import axios from 'axios';

export class InstagramAdapter extends BasePlatformAdapter {
  private accessToken: string;
  private pageId: string;
  private webhookVerifyToken: string;

  constructor() {
    super();
    this.accessToken = process.env.INSTAGRAM_ACCESS_TOKEN || '';
    this.pageId = process.env.INSTAGRAM_PAGE_ID || '';
    this.webhookVerifyToken = process.env.INSTAGRAM_WEBHOOK_VERIFY_TOKEN || '';
  }

  async connect(): Promise<void> {
    if (!this.accessToken || !this.pageId) {
      console.warn('⚠️  Instagram credentials not configured. Adapter disabled.');
      return;
    }

    try {
      // Test API access
      const response = await axios.get(`https://graph.facebook.com/v18.0/${this.pageId}`, {
        params: {
          access_token: this.accessToken,
          fields: 'name,id'
        }
      });

      if (!response.data.id) {
        throw new Error('Instagram API authentication failed');
      }

      this.connected = true;
      console.log('✅ Instagram adapter connected');
    } catch (error) {
      console.error('Failed to connect to Instagram:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
  }

  async sendMessage(roomId: string, content: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Instagram adapter not connected');
    }

    try {
      // Instagram Basic Display API doesn't support sending messages
      // This would require Instagram Messaging API (business accounts)
      await axios.post(`https://graph.facebook.com/v18.0/${roomId}/messages`, {
        message: {
          text: content
        },
        access_token: this.accessToken
      });
    } catch (error) {
      console.error('Failed to send Instagram message:', error);
      throw error;
    }
  }

  async getRooms(): Promise<any[]> {
    if (!this.connected) {
      return [];
    }

    try {
      // Get conversations (requires Instagram Messaging API)
      const response = await axios.get(`https://graph.facebook.com/v18.0/${this.pageId}/conversations`, {
        params: {
          access_token: this.accessToken,
          fields: 'id,participants,updated_time'
        }
      });

      return response.data.data.map((conversation: any) => ({
        id: conversation.id,
        name: `Instagram Chat ${conversation.id}`,
        platform: 'instagram',
        participants: conversation.participants?.data?.length || 0,
        lastActivity: new Date(conversation.updated_time)
      }));
    } catch (error) {
      console.error('Failed to get Instagram conversations:', error);
      return [];
    }
  }

  async getMessages(roomId: string, limit: number): Promise<any[]> {
    if (!this.connected) {
      return [];
    }

    try {
      const response = await axios.get(`https://graph.facebook.com/v18.0/${roomId}/messages`, {
        params: {
          access_token: this.accessToken,
          limit: limit,
          fields: 'id,created_time,from,message'
        }
      });

      return response.data.data.map((msg: any) => ({
        id: msg.id,
        sender: msg.from?.id || 'unknown',
        content: msg.message || '[Media]',
        timestamp: new Date(msg.created_time),
        platform: 'instagram'
      }));
    } catch (error) {
      console.error('Failed to get Instagram messages:', error);
      return [];
    }
  }

  // Webhook handler for Instagram
  public handleWebhook(payload: any): void {
    if (payload.entry) {
      payload.entry.forEach((entry: any) => {
        if (entry.messaging) {
          entry.messaging.forEach((event: any) => {
            if (event.message) {
              this.triggerMessageHandlers({
                platform: 'instagram',
                roomId: event.sender.id,
                sender: event.sender.id,
                content: event.message.text || '[Media]',
                timestamp: new Date(event.timestamp),
                messageType: event.message.attachments ? 'media' : 'text'
              });
            }
          });
        }
      });
    }
  }

  // Webhook verification for Instagram
  public verifyWebhook(mode: string, token: string, challenge: string): string | null {
    if (mode === 'subscribe' && token === this.webhookVerifyToken) {
      return challenge;
    }
    return null;
  }
}