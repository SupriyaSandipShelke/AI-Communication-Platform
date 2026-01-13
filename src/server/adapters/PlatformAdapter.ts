// Platform adapter interface
export interface PlatformAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  sendMessage(roomId: string, content: string): Promise<void>;
  onMessage(handler: (message: any) => void): void;
  getRooms(): Promise<any[]>;
  getMessages(roomId: string, limit: number): Promise<any[]>;
}

// Base class for platform adapters
export abstract class BasePlatformAdapter implements PlatformAdapter {
  protected connected: boolean = false;
  protected messageHandlers: Array<(message: any) => void> = [];

  abstract connect(): Promise<void>;
  abstract disconnect(): Promise<void>;
  abstract sendMessage(roomId: string, content: string): Promise<void>;
  abstract getRooms(): Promise<any[]>;
  abstract getMessages(roomId: string, limit: number): Promise<any[]>;

  onMessage(handler: (message: any) => void): void {
    this.messageHandlers.push(handler);
  }

  protected triggerMessageHandlers(message: any): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('Error in message handler:', error);
      }
    });
  }

  isConnected(): boolean {
    return this.connected;
  }
}
