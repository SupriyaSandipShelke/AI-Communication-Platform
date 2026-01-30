import { BasePlatformAdapter } from './PlatformAdapter.js';
import axios from 'axios';

export class TelegramAdapter extends BasePlatformAdapter {
  private botToken: string;
  private webhookUrl: string;
  private pollingInterval: NodeJS.Timeout | null = null;
  private lastUpdateId: number = 0;

  constructor() {
    super();
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || '';
    this.webhookUrl = process.env.TELEGRAM_WEBHOOK_URL || '';
  }

  async connect(): Promise<void> {
    if (!this.botToken) {
      console.warn('⚠️  Telegram bot token not configured. Adapter disabled.');
      return;
    }

    try {
      // Test bot authentication
      const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getMe`);
      
      if (!response.data.ok) {
        throw new Error('Telegram bot authentication failed');
      }

      this.connected = true;
      console.log('✅ Telegram adapter connected');

      // Start polling for messages (alternative to webhooks)
      if (!this.webhookUrl) {
        this.startPolling();
      }
    } catch (error) {
      console.error('Failed to connect to Telegram:', error);
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
    this.pollingInterval = setInterval(async () => {
      try {
        const response = await axios.get(`https://api.telegram.org/bot${this.botToken}/getUpdates`, {
          params: {
            offset: this.lastUpdateId + 1,
            timeout: 30
          }
        });

        if (response.data.ok && response.data.result.length > 0) {
          for (const update of response.data.result) {
            this.handleUpdate(update);
            this.lastUpdateId = update.update_id;
          }
        }
      } catch (error) {
        console.error('Error polling Telegram updates:', error);
      }
    }, 1000);
  }

  private handleUpdate(update: any): void {
    if (update.message) {
      const message = update.message;
      this.triggerMessageHandlers({
        platform: 'telegram',
        roomId: message.chat.id.toString(),
        sender: message.from.id.toString(),
        senderName: `${message.from.first_name} ${message.from.last_name || ''}`.trim(),
        content: message.text || message.caption || '[Media]',
        timestamp: new Date(message.date * 1000),
        messageType: message.photo ? 'image' : message.video ? 'video' : message.document ? 'document' : 'text'
      });
    }
  }

  async sendMessage(roomId: string, content: string): Promise<void> {
    if (!this.connected) {
      throw new Error('Telegram adapter not connected');
    }

    try {
      await axios.post(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
        chat_id: roomId,
        text: content,
        parse_mode: 'HTML'
      });
    } catch (error) {
      console.error('Failed to send Telegram message:', error);
      throw error;
    }
  }

  async getRooms(): Promise<any[]> {
    // Telegram doesn't have a direct API to get all chats
    // Return cached chats from database
    return [];
  }

  async getMessages(roomId: string, limit: number): Promise<any[]> {
    // Telegram Bot API doesn't support getting message history
    // Return messages from local database
    return [];
  }

  // Webhook handler for production use
  public handleWebhook(update: any): void {
    this.handleUpdate(update);
  }
}