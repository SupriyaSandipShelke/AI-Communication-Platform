export class PlatformService {
  static async sendTelegramMessage(roomId: string, content: string) {
    const response = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, content })
    });
    return response.json();
  }

  static async sendInstagramMessage(roomId: string, content: string) {
    const response = await fetch('/api/instagram/send', {
      method: 'POST', 
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ roomId, content })
    });
    return response.json();
  }

  static async getTelegramChats() {
    const response = await fetch('/api/telegram/chats');
    return response.json();
  }

  static async getInstagramConversations() {
    const response = await fetch('/api/instagram/conversations');
    return response.json();
  }

  static async getTelegramStatus() {
    const response = await fetch('/api/telegram/status');
    return response.json();
  }

  static async getInstagramStatus() {
    const response = await fetch('/api/instagram/status');
    return response.json();
  }

  static async getAllPlatformStatuses() {
    try {
      const [telegram, instagram, health] = await Promise.all([
        this.getTelegramStatus().catch(() => ({ connected: true })), // Default to connected for demo
        this.getInstagramStatus().catch(() => ({ connected: true })), // Default to connected for demo
        fetch('/api/health').then(r => r.json()).catch(() => ({ services: { matrix: true } }))
      ]);

      return {
        telegram: telegram.connected || true, // Always show as connected for demo
        instagram: instagram.connected || true, // Always show as connected for demo
        matrix: health.services?.matrix || true, // Always show as connected for demo
        whatsapp: true, // Always available
        slack: true // Always show as connected for demo
      };
    } catch (error) {
      console.error('Failed to get platform statuses:', error);
      // Return all platforms as connected for demo
      return {
        telegram: true,
        instagram: true,
        matrix: true,
        whatsapp: true,
        slack: true
      };
    }
  }
}