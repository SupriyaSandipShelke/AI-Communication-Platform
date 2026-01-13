import { BasePlatformAdapter } from './PlatformAdapter.js';
import axios from 'axios';

/**
 * Slack Platform Adapter
 * To use this adapter:
 * 1. Create a Slack App at https://api.slack.com/apps
 * 2. Add Bot Token Scopes: channels:history, channels:read, chat:write, im:history, im:read
 * 3. Install the app to your workspace
 * 4. Set SLACK_BOT_TOKEN in .env
 */
export class SlackAdapter extends BasePlatformAdapter {
  private botToken: string;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastMessageTimestamp: Map<string, string> = new Map();

  constructor() {
    super();
    this.botToken = process.env.SLACK_BOT_TOKEN || '';
  }

  async connect(): Promise<void> {
    if (!this.botToken) {
      console.warn('⚠️  Slack bot token not configured');
      return;
    }

    try {
      // Test authentication
      const response = await axios.post(
        'https://slack.com/api/auth.test',
        {},
        {
          headers: {
            Authorization: `Bearer ${this.botToken}`,
          },
        }
      );

      if (!response.data.ok) {
        throw new Error('Slack authentication failed');
      }

      this.connected = true;
      console.log('✅ Slack adapter connected');

      // Start polling for messages
      this.startPolling();
    } catch (error) {
      console.error('Failed to connect to Slack:', error);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    this.connected = false;
  }

  private startPolling(): void {
    // Poll for new messages every 5 seconds
    this.pollingInterval = setInterval(async () => {
      try {
        const rooms = await this.getRooms();
        for (const room of rooms) {
          await this.pollRoomMessages(room.id);
        }
      } catch (error) {
        console.error('Error polling Slack messages:', error);
      }
    }, 5000);
  }

  private async pollRoomMessages(channelId: string): Promise<void> {
    try {
      const lastTs = this.lastMessageTimestamp.get(channelId) || '0';

      const response = await axios.get('https://slack.com/api/conversations.history', {
        params: {
          channel: channelId,
          oldest: lastTs,
          limit: 10,
        },
        headers: {
          Authorization: `Bearer ${this.botToken}`,
        },
      });

      if (response.data.ok && response.data.messages) {
        const messages = response.data.messages.reverse();

        for (const message of messages) {
          if (message.ts > lastTs) {
            this.triggerMessageHandlers({
              platform: 'slack',
              roomId: channelId,
              sender: message.user || 'unknown',
              content: message.text,
              timestamp: new Date(parseFloat(message.ts) * 1000),
            });

            this.lastMessageTimestamp.set(channelId, message.ts);
          }
        }
      }
    } catch (error) {
      console.error(`Error polling Slack channel ${channelId}:`, error);
    }
  }

  async sendMessage(roomId: string, content: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Slack adapter not connected');
    }

    try {
      await axios.post(
        'https://slack.com/api/chat.postMessage',
        {
          channel: roomId,
          text: content,
        },
        {
          headers: {
            Authorization: `Bearer ${this.botToken}`,
            'Content-Type': 'application/json',
          },
        }
      );
    } catch (error) {
      console.error('Failed to send Slack message:', error);
      throw error;
    }
  }

  async getRooms(): Promise<any[]> {
    if (!this.connected) {
      return [];
    }

    try {
      const response = await axios.get('https://slack.com/api/conversations.list', {
        params: {
          types: 'public_channel,private_channel,im,mpim',
          limit: 100,
        },
        headers: {
          Authorization: `Bearer ${this.botToken}`,
        },
      });

      if (!response.data.ok) {
        throw new Error('Failed to get Slack channels');
      }

      return response.data.channels.map((channel: any) => ({
        id: channel.id,
        name: channel.name || channel.id,
        platform: 'slack',
        members: channel.num_members || 0,
      }));
    } catch (error) {
      console.error('Failed to get Slack rooms:', error);
      return [];
    }
  }

  async getMessages(roomId: string, limit: number): Promise<any[]> {
    if (!this.connected) {
      return [];
    }

    try {
      const response = await axios.get('https://slack.com/api/conversations.history', {
        params: {
          channel: roomId,
          limit: limit,
        },
        headers: {
          Authorization: `Bearer ${this.botToken}`,
        },
      });

      if (!response.data.ok) {
        return [];
      }

      return response.data.messages
        .reverse()
        .map((msg: any) => ({
          id: msg.ts,
          sender: msg.user || 'unknown',
          content: msg.text,
          timestamp: new Date(parseFloat(msg.ts) * 1000),
          platform: 'slack',
        }));
    } catch (error) {
      console.error('Failed to get Slack messages:', error);
      return [];
    }
  }
}
