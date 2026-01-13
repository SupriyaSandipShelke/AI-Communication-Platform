import cron from 'node-cron';
import { AIService } from './AIService';
import { DatabaseService } from './DatabaseService';
import { VectorSearchService } from './VectorSearchService';

interface ScheduledSummary {
  id: string;
  userId: string;
  scheduleTime: string; // HH:MM format
  timezone: string;
  enabled: boolean;
  createdAt: Date;
  lastRun?: Date;
}

export class ScheduledSummariesService {
  private scheduledSummaries: Map<string, ScheduledSummary> = new Map();
  private aiService: AIService;
  private dbService: DatabaseService;
  private vectorSearchService: VectorSearchService;
  private configured: boolean = false;

  constructor(
    aiService: AIService,
    dbService: DatabaseService,
    vectorSearchService: VectorSearchService
  ) {
    this.aiService = aiService;
    this.dbService = dbService;
    this.vectorSearchService = vectorSearchService;

    if (this.aiService.isConfigured()) {
      this.configured = true;
      this.loadScheduledSummaries();
      this.startScheduler();
    } else {
      console.warn('⚠️  Scheduled summaries service disabled - AI service not configured');
    }
  }

  private async loadScheduledSummaries(): Promise<void> {
    try {
      // In a real implementation, this would load from database
      // For now, we'll initialize with an empty map
      console.log('✅ Loaded scheduled summaries configuration');
    } catch (error) {
      console.error('❌ Failed to load scheduled summaries:', error);
    }
  }

  private startScheduler(): void {
    // Check every minute for scheduled summaries to run
    cron.schedule('* * * * *', () => {
      this.checkAndRunScheduledSummaries();
    });

    console.log('✅ Scheduled summaries scheduler started');
  }

  private async checkAndRunScheduledSummaries(): Promise<void> {
    if (!this.configured) return;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    for (const [id, summary] of this.scheduledSummaries.entries()) {
      if (summary.enabled && summary.scheduleTime === currentTime) {
        await this.generateAndSendSummary(summary);
      }
    }
  }

  private async generateAndSendSummary(summary: ScheduledSummary): Promise<void> {
    try {
      // Get today's messages for the user
      const startOfDay = new Date();
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date();
      endOfDay.setHours(23, 59, 59, 999);

      const messages = await this.dbService.getMessages({
        startDate: startOfDay,
        endDate: endOfDay,
        limit: 1000
      });

      if (messages.length === 0) {
        console.log(`No messages to summarize for user ${summary.userId}`);
        return;
      }

      // Generate summary using AI
      const summaryResult = await this.aiService.generateDailySummary(messages);

      // In a real implementation, this would send the summary to the user
      // via email, push notification, or save it for retrieval
      console.log(`Generated summary for user ${summary.userId}:`, summaryResult);

      // Update last run time
      const updatedSummary = { ...summary, lastRun: new Date() };
      this.scheduledSummaries.set(summary.id, updatedSummary);

      // Save to database
      await this.dbService.updateScheduledSummary(summary.id, {
        lastRun: updatedSummary.lastRun
      });

      console.log(`✅ Daily summary sent to user ${summary.userId}`);
    } catch (error) {
      console.error(`❌ Failed to generate summary for user ${summary.userId}:`, error);
    }
  }

  async createScheduledSummary(userId: string, scheduleTime: string, timezone: string = 'UTC'): Promise<ScheduledSummary> {
    if (!this.configured) {
      throw new Error('Scheduled summaries service is not configured');
    }

    const id = this.generateId();
    const summary: ScheduledSummary = {
      id,
      userId,
      scheduleTime,
      timezone,
      enabled: true,
      createdAt: new Date()
    };

    this.scheduledSummaries.set(id, summary);

    // Save to database
    await this.dbService.createScheduledSummary(summary);

    return summary;
  }

  async updateScheduledSummary(id: string, updates: Partial<ScheduledSummary>): Promise<ScheduledSummary> {
    const existing = this.scheduledSummaries.get(id);
    if (!existing) {
      throw new Error(`Scheduled summary with id ${id} not found`);
    }

    const updated = { ...existing, ...updates } as ScheduledSummary;
    this.scheduledSummaries.set(id, updated);

    // Save to database
    await this.dbService.updateScheduledSummary(id, updates);

    return updated;
  }

  async deleteScheduledSummary(id: string): Promise<void> {
    this.scheduledSummaries.delete(id);
    
    // Remove from database
    await this.dbService.deleteScheduledSummary(id);
  }

  async getUserScheduledSummary(userId: string): Promise<ScheduledSummary | null> {
    for (const summary of this.scheduledSummaries.values()) {
      if (summary.userId === userId) {
        return summary;
      }
    }
    return null;
  }

  async getDailySummary(userId: string): Promise<any> {
    if (!this.configured) {
      return {
        summary: 'Scheduled summaries service is not configured',
        keyTopics: [],
        sentiment: 'neutral',
        actionItems: []
      };
    }

    // Get today's messages for the user
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const messages = await this.dbService.getMessages({
      startDate: startOfDay,
      endDate: endOfDay,
      limit: 1000
    });

    if (messages.length === 0) {
      return {
        summary: 'No messages found for today',
        keyTopics: [],
        sentiment: 'neutral',
        actionItems: []
      };
    }

    // Generate summary using AI
    return await this.aiService.generateDailySummary(messages);
  }

  async getWeeklySummary(userId: string, daysBack: number = 7): Promise<any> {
    if (!this.configured) {
      return {
        summary: 'Scheduled summaries service is not configured',
        keyTopics: [],
        sentiment: 'neutral',
        actionItems: [],
        dailySummaries: []
      };
    }

    // Get messages for the past week
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);

    const messages = await this.dbService.getMessages({
      startDate,
      endDate,
      limit: 5000
    });

    if (messages.length === 0) {
      return {
        summary: 'No messages found for the past week',
        keyTopics: [],
        sentiment: 'neutral',
        actionItems: [],
        dailySummaries: []
      };
    }

    // Group messages by day and generate daily summaries
    const dailyMessages = this.groupMessagesByDay(messages, daysBack);
    const dailySummaries: Array<{
      date: any;
      summary: string;
      keyTopics: string[];
      sentiment: 'positive' | 'neutral' | 'negative';
      actionItems: string[];
    }> = [];

    for (const dayMessages of dailyMessages) {
      if (dayMessages.length > 0) {
        const dailySummary = await this.aiService.generateDailySummary(dayMessages);
        dailySummaries.push({
          date: dayMessages[0].timestamp,
          summary: dailySummary.summary,
          keyTopics: dailySummary.keyTopics,
          sentiment: dailySummary.sentiment,
          actionItems: dailySummary.actionItems
        });
      }
    }

    // Generate overall weekly summary
    const weeklySummary = await this.aiService.generateDailySummary(messages);

    return {
      ...weeklySummary,
      dailySummaries
    };
  }

  private groupMessagesByDay(messages: any[], daysBack: number): any[][] {
    const result: any[][] = [];
    for (let i = 0; i < daysBack; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      const dayMessages = messages.filter(msg => {
        const msgDate = new Date(msg.timestamp);
        return msgDate >= startOfDay && msgDate <= endOfDay;
      });

      if (dayMessages.length > 0) {
        result.push(dayMessages);
      }
    }
    return result.reverse(); // Oldest first
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }

  isConfigured(): boolean {
    return this.configured;
  }
}