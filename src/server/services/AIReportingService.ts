import { AIService } from './AIService.js';
import { DatabaseService } from './DatabaseService.js';
import cron from 'node-cron';

interface CommunicationInsight {
  totalMessages: number;
  messagesByHour: Record<number, number>;
  topContacts: Array<{ contact: string; count: number }>;
  sentimentBreakdown: {
    positive: number;
    neutral: number;
    negative: number;
  };
  productivityScore: number;
  recommendations: string[];
}

interface ConversationSummary {
  roomId: string;
  roomName: string;
  messageCount: number;
  participants: string[];
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  sentiment: string;
  startDate: Date;
  endDate: Date;
}

export class AIReportingService {
  private aiService: AIService;
  private dbService: DatabaseService;
  private scheduledJobs: Map<string, any> = new Map();

  constructor(aiService: AIService, dbService: DatabaseService) {
    this.aiService = aiService;
    this.dbService = dbService;
  }

  /**
   * Initialize scheduled reporting jobs
   */
  initializeScheduledJobs(): void {
    // Daily summary at 6 PM
    const dailySummaryJob = cron.schedule('0 18 * * *', async () => {
      console.log('⏰ Running scheduled daily summary generation...');
      try {
        await this.generateAndStoreDailySummary(new Date());
      } catch (error) {
        console.error('Failed to generate scheduled daily summary:', error);
      }
    });

    // Weekly report on Sunday at 9 AM
    const weeklyReportJob = cron.schedule('0 9 * * 0', async () => {
      console.log('⏰ Running scheduled weekly report generation...');
      try {
        await this.generateWeeklyReport();
      } catch (error) {
        console.error('Failed to generate scheduled weekly report:', error);
      }
    });

    this.scheduledJobs.set('dailySummary', dailySummaryJob);
    this.scheduledJobs.set('weeklyReport', weeklyReportJob);

    console.log('✅ Scheduled reporting jobs initialized');
  }

  /**
   * Generate daily summary for a specific date
   */
  async generateAndStoreDailySummary(date: Date): Promise<any> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    // Fetch today's messages
    const messages = await this.dbService.getMessages({
      startDate: startOfDay,
      endDate: endOfDay
    });

    if (messages.length === 0) {
      return { summary: 'No messages today', messageCount: 0 };
    }

    // Generate AI summary
    const summary = await this.aiService.generateDailySummary(messages);
    summary.messageCount = messages.length;

    // Store in database
    await this.dbService.saveDailySummary(date, summary);

    return summary;
  }

  /**
   * Generate weekly report with insights
   */
  async generateWeeklyReport(): Promise<CommunicationInsight> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 7);

    const messages = await this.dbService.getMessages({
      startDate,
      endDate
    });

    // Analyze message patterns
    const messagesByHour: Record<number, number> = {};
    const contactCounts: Record<string, number> = {};

    messages.forEach((msg: any) => {
      const hour = new Date(msg.timestamp).getHours();
      messagesByHour[hour] = (messagesByHour[hour] || 0) + 1;
      contactCounts[msg.sender] = (contactCounts[msg.sender] || 0) + 1;
    });

    // Top contacts
    const topContacts = Object.entries(contactCounts)
      .map(([contact, count]) => ({ contact, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Calculate productivity score (0-100)
    const productivityScore = this.calculateProductivityScore(messages);

    // Generate AI-powered recommendations
    const recommendations = await this.generateRecommendations(messages);

    const insight: CommunicationInsight = {
      totalMessages: messages.length,
      messagesByHour,
      topContacts,
      sentimentBreakdown: {
        positive: 0,
        neutral: 0,
        negative: 0
      },
      productivityScore,
      recommendations
    };

    return insight;
  }

  /**
   * Generate conversation-specific summary
   */
  async generateConversationSummary(
    roomId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ConversationSummary> {
    const end = endDate || new Date();
    const start = startDate || new Date(end.getTime() - 7 * 24 * 60 * 60 * 1000); // Last 7 days

    const messages = await this.dbService.getMessages({
      roomId,
      startDate: start,
      endDate: end
    });

    if (messages.length === 0) {
      throw new Error('No messages found in this conversation');
    }

    // Extract unique participants
    const participants = [...new Set(messages.map((m: any) => m.sender))];

    // Generate AI summary for this specific conversation
    const aiSummary = await this.aiService.generateDailySummary(messages);

    const conversationSummary: ConversationSummary = {
      roomId,
      roomName: messages[0]?.room_id || roomId,
      messageCount: messages.length,
      participants,
      summary: aiSummary.summary,
      keyTopics: aiSummary.keyTopics || [],
      actionItems: aiSummary.actionItems || [],
      sentiment: aiSummary.sentiment,
      startDate: start,
      endDate: end
    };

    return conversationSummary;
  }

  /**
   * Detect priority conversations based on AI analysis
   */
  async detectPriorityConversations(): Promise<Array<{ roomId: string; score: number; reason: string }>> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setHours(startDate.getHours() - 24); // Last 24 hours

    const messages = await this.dbService.getMessages({
      startDate,
      endDate
    });

    // Group messages by room
    const roomMessages: Record<string, any[]> = {};
    messages.forEach((msg: any) => {
      if (!roomMessages[msg.room_id]) {
        roomMessages[msg.room_id] = [];
      }
      roomMessages[msg.room_id].push(msg);
    });

    // Analyze each conversation
    const priorities = [];

    for (const [roomId, msgs] of Object.entries(roomMessages)) {
      if (msgs.length === 0) continue;

      // Calculate priority score based on:
      // 1. Message frequency
      // 2. High-priority message count
      // 3. Recent activity

      const highPriorityCount = msgs.filter((m: any) => m.priority === 'high').length;
      const messageFrequency = msgs.length / 24; // messages per hour
      const recentActivity = msgs.filter((m: any) => {
        const msgTime = new Date(m.timestamp).getTime();
        return (Date.now() - msgTime) < 3 * 60 * 60 * 1000; // Last 3 hours
      }).length;

      const score = (highPriorityCount * 3) + (messageFrequency * 2) + recentActivity;

      let reason = '';
      if (highPriorityCount > 5) {
        reason = 'Multiple high-priority messages';
      } else if (messageFrequency > 5) {
        reason = 'High message volume';
      } else if (recentActivity > 10) {
        reason = 'Active ongoing conversation';
      } else {
        reason = 'Moderate activity';
      }

      if (score > 10) {
        priorities.push({ roomId, score, reason });
      }
    }

    return priorities.sort((a, b) => b.score - a.score);
  }

  /**
   * Generate communication insights report
   */
  async generateInsightsReport(days: number = 7): Promise<any> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const messages = await this.dbService.getMessages({
      startDate,
      endDate
    });

    // Peak communication hours
    const hourlyActivity: Record<number, number> = {};
    messages.forEach((msg: any) => {
      const hour = new Date(msg.timestamp).getHours();
      hourlyActivity[hour] = (hourlyActivity[hour] || 0) + 1;
    });

    const peakHours = Object.entries(hourlyActivity)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => parseInt(hour));

    // Platform distribution
    const platformCounts: Record<string, number> = {};
    messages.forEach((msg: any) => {
      platformCounts[msg.platform] = (platformCounts[msg.platform] || 0) + 1;
    });

    // Response time analysis
    const averageResponseTime = this.calculateAverageResponseTime(messages);

    // Priority distribution
    const priorityCounts = {
      high: messages.filter((m: any) => m.priority === 'high').length,
      medium: messages.filter((m: any) => m.priority === 'medium').length,
      low: messages.filter((m: any) => m.priority === 'low').length
    };

    return {
      period: {
        startDate,
        endDate,
        days
      },
      totalMessages: messages.length,
      dailyAverage: Math.round(messages.length / days),
      peakHours,
      platformDistribution: platformCounts,
      priorityDistribution: priorityCounts,
      averageResponseTime: `${averageResponseTime} minutes`,
      insights: await this.generateInsights(messages)
    };
  }

  /**
   * Calculate productivity score (0-100)
   */
  private calculateProductivityScore(messages: any[]): number {
    if (messages.length === 0) return 0;

    // Factors:
    // - Message/response ratio
    // - Priority message handling
    // - Response time
    // - Active hours

    const highPriorityCount = messages.filter((m: any) => m.priority === 'high').length;
    const totalMessages = messages.length;

    // Simple scoring algorithm
    let score = 50; // Base score

    // Bonus for handling high priority messages
    if (highPriorityCount > 0) {
      score += Math.min(20, highPriorityCount * 2);
    }

    // Bonus for consistent activity
    const uniqueDays = new Set(messages.map((m: any) => 
      new Date(m.timestamp).toDateString()
    )).size;
    score += Math.min(20, uniqueDays * 3);

    // Cap at 100
    return Math.min(100, Math.max(0, score));
  }

  /**
   * Generate AI-powered recommendations
   */
  private async generateRecommendations(messages: any[]): Promise<string[]> {
    if (messages.length === 0) {
      return ['Start communicating to receive personalized recommendations'];
    }

    const recommendations = [];

    // Analyze patterns
    const hourCounts: Record<number, number> = {};
    messages.forEach((msg: any) => {
      const hour = new Date(msg.timestamp).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });

    // Peak activity hours
    const peakHour = Object.entries(hourCounts)
      .sort(([, a], [, b]) => b - a)[0];

    if (peakHour) {
      recommendations.push(
        `Your peak communication time is ${peakHour[0]}:00. Consider scheduling important calls then.`
      );
    }

    // High priority messages
    const highPriorityCount = messages.filter((m: any) => m.priority === 'high').length;
    if (highPriorityCount > 10) {
      recommendations.push(
        `You have ${highPriorityCount} high-priority messages. Consider addressing them first.`
      );
    }

    // Platform usage
    const platforms = new Set(messages.map((m: any) => m.platform));
    if (platforms.size > 3) {
      recommendations.push(
        `You're active on ${platforms.size} platforms. Our unified interface can save you time.`
      );
    }

    return recommendations;
  }

  /**
   * Calculate average response time
   */
  private calculateAverageResponseTime(messages: any[]): number {
    // Simplified: Return mock value for MVP
    // In production, track conversation threads
    return 15; // 15 minutes average
  }

  /**
   * Generate AI-powered insights
   */
  private async generateInsights(messages: any[]): Promise<string[]> {
    const insights = [];

    // Communication volume insight
    if (messages.length > 100) {
      insights.push('High communication volume detected - you\'re staying well connected');
    } else if (messages.length < 20) {
      insights.push('Low communication volume - consider reaching out more to stay in the loop');
    }

    // Priority insights
    const highPriorityCount = messages.filter((m: any) => m.priority === 'high').length;
    const priorityRatio = messages.length > 0 ? (highPriorityCount / messages.length) * 100 : 0;

    if (priorityRatio > 30) {
      insights.push(`${priorityRatio.toFixed(0)}% of messages are high priority - focus on these first`);
    }

    // Platform diversity
    const platforms = new Set(messages.map((m: any) => m.platform));
    if (platforms.size > 2) {
      insights.push(`Active across ${platforms.size} platforms - unified view is helping you stay organized`);
    }

    return insights;
  }

  /**
   * Stop all scheduled jobs
   */
  stopScheduledJobs(): void {
    this.scheduledJobs.forEach((job, name) => {
      job.stop();
      console.log(`⏹️  Stopped scheduled job: ${name}`);
    });
    this.scheduledJobs.clear();
  }
}
