import OpenAI from 'openai';
import { GroupService, GroupMetadata, GroupMember } from './GroupService.js';
import { DatabaseService } from './DatabaseService.js';
import { AIMemoryVaultService } from './AIMemoryVaultService.js';

interface GroupSummary {
  groupId: string;
  groupName: string;
  date: Date;
  messageCount: number;
  activeMembers: string[];
  summary: string;
  keyTopics: string[];
  keyDecisions: string[];
  actionItems: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
}

interface GroupInsights {
  groupId: string;
  groupName: string;
  memberActivity: MemberActivity[];
  inactiveMembers: string[];
  unresolvedQuestions: UnresolvedQuestion[];
  topContributors: string[];
  engagementScore: number;
  recommendations: string[];
}

interface MemberActivity {
  userId: string;
  displayName: string;
  messageCount: number;
  lastActive: Date;
  engagementLevel: 'high' | 'medium' | 'low';
}

interface UnresolvedQuestion {
  question: string;
  askedBy: string;
  timestamp: Date;
  context: string;
}

/**
 * AI Group Intelligence Service
 * 
 * Provides AI-powered insights for group chats:
 * - Daily summaries
 * - Decision extraction
 * - Inactive member detection
 * - Unanswered questions
 * - Engagement analytics
 */
export class GroupAIService {
  private openai: OpenAI | null;
  private configured: boolean = false;
  private groupService: GroupService;
  private dbService: DatabaseService;
  private memoryVault: AIMemoryVaultService;

  constructor(
    groupService: GroupService,
    dbService: DatabaseService,
    memoryVault: AIMemoryVaultService
  ) {
    this.groupService = groupService;
    this.dbService = dbService;
    this.memoryVault = memoryVault;

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.configured = true;
    } else {
      console.warn('⚠️  Group AI Service: OpenAI API key not configured');
      this.openai = null;
    }
  }

  /**
   * Generate daily group summary
   */
  async generateDailySummary(groupId: string, date?: Date): Promise<GroupSummary> {
    const group = await this.groupService.getGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const targetDate = date || new Date();
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    // Get messages from the day
    const messages = await this.getGroupMessages(groupId, startOfDay, endOfDay);

    if (messages.length === 0) {
      return {
        groupId,
        groupName: group.name,
        date: targetDate,
        messageCount: 0,
        activeMembers: [],
        summary: 'No messages today.',
        keyTopics: [],
        keyDecisions: [],
        actionItems: [],
        sentiment: 'neutral',
      };
    }

    // Extract active members
    const activeMembers = [...new Set(messages.map(m => m.sender))];

    // Generate AI summary if configured
    let summary = '';
    let keyTopics: string[] = [];
    let keyDecisions: string[] = [];
    let actionItems: string[] = [];
    let sentiment: 'positive' | 'neutral' | 'negative' = 'neutral';

    if (this.configured && this.openai) {
      const aiAnalysis = await this.analyzewWithAI(messages, group.name);
      summary = aiAnalysis.summary;
      keyTopics = aiAnalysis.keyTopics;
      keyDecisions = aiAnalysis.keyDecisions;
      actionItems = aiAnalysis.actionItems;
      sentiment = aiAnalysis.sentiment;
    } else {
      // Fallback: rule-based summary
      summary = `${messages.length} messages exchanged by ${activeMembers.length} members.`;
      keyTopics = this.extractKeywordsRuleBased(messages);
    }

    return {
      groupId,
      groupName: group.name,
      date: targetDate,
      messageCount: messages.length,
      activeMembers,
      summary,
      keyTopics,
      keyDecisions,
      actionItems,
      sentiment,
    };
  }

  /**
   * Get group insights and analytics
   */
  async getGroupInsights(groupId: string, days: number = 7): Promise<GroupInsights> {
    const group = await this.groupService.getGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    const members = await this.groupService.getMembers(groupId);
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - days);

    // Get messages for analysis period
    const messages = await this.getGroupMessages(groupId, startDate, endDate);

    // Analyze member activity
    const memberActivity = this.analyzeMemberActivity(members, messages);

    // Identify inactive members
    const inactiveMembers = memberActivity
      .filter(m => m.engagementLevel === 'low')
      .map(m => m.displayName);

    // Find unresolved questions
    const unresolvedQuestions = await this.findUnresolvedQuestions(messages);

    // Identify top contributors
    const topContributors = memberActivity
      .sort((a, b) => b.messageCount - a.messageCount)
      .slice(0, 5)
      .map(m => m.displayName);

    // Calculate engagement score
    const engagementScore = this.calculateEngagementScore(memberActivity, messages.length);

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      memberActivity,
      unresolvedQuestions,
      engagementScore
    );

    return {
      groupId,
      groupName: group.name,
      memberActivity,
      inactiveMembers,
      unresolvedQuestions,
      topContributors,
      engagementScore,
      recommendations,
    };
  }

  /**
   * Extract group decisions for memory vault
   */
  async extractGroupDecisions(groupId: string): Promise<any[]> {
    const group = await this.groupService.getGroup(groupId);
    if (!group) {
      throw new Error('Group not found');
    }

    // Get recent messages (last 24 hours)
    const endDate = new Date();
    const startDate = new Date(endDate);
    startDate.setDate(startDate.getDate() - 1);

    const messages = await this.getGroupMessages(groupId, startDate, endDate);

    // Extract memories (decisions, commitments) using AI Memory Vault
    const memories = [];
    for (const message of messages) {
      const extracted = await this.memoryVault.extractMemories(
        message.content,
        message.sender,
        groupId,
        'matrix',
        message.id || ''
      );
      memories.push(...extracted.filter(m => m.type === 'decision' || m.type === 'commitment'));
    }

    return memories;
  }

  /**
   * Get group messages for time range
   */
  private async getGroupMessages(
    groupId: string,
    startDate: Date,
    endDate: Date
  ): Promise<any[]> {
    // In production, query from database with room filter
    const allMessages = await this.dbService.getMessages({
      limit: 1000,
      startDate,
      endDate,
    });

    // Filter by group's room ID
    const group = await this.groupService.getGroup(groupId);
    if (!group) return [];

    return allMessages.filter(m => m.roomId === group.matrixRoomId);
  }

  /**
   * AI-powered message analysis
   */
  private async analyzewWithAI(messages: any[], groupName: string): Promise<any> {
    if (!this.openai) {
      throw new Error('OpenAI not configured');
    }

    const conversationText = messages
      .map(m => `${m.sender}: ${m.content}`)
      .join('\n');

    const prompt = `Analyze this group chat conversation from "${groupName}" and provide:

Conversation:
${conversationText}

Provide analysis as JSON:
{
  "summary": "<2-3 sentence summary>",
  "keyTopics": ["topic1", "topic2", "topic3"],
  "keyDecisions": ["decision1", "decision2"],
  "actionItems": ["action1", "action2"],
  "sentiment": "positive|neutral|negative"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        summary: result.summary || 'No summary available',
        keyTopics: result.keyTopics || [],
        keyDecisions: result.keyDecisions || [],
        actionItems: result.actionItems || [],
        sentiment: result.sentiment || 'neutral',
      };
    } catch (error) {
      console.error('AI analysis failed:', error);
      return {
        summary: `${messages.length} messages in group`,
        keyTopics: [],
        keyDecisions: [],
        actionItems: [],
        sentiment: 'neutral',
      };
    }
  }

  /**
   * Rule-based keyword extraction (fallback)
   */
  private extractKeywordsRuleBased(messages: any[]): string[] {
    const text = messages.map(m => m.content).join(' ').toLowerCase();
    const commonWords = new Set(['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'but', 'in', 'with', 'to', 'for', 'of', 'as', 'by']);
    
    const words = text.split(/\s+/).filter(w => w.length > 3 && !commonWords.has(w));
    const wordFreq = new Map<string, number>();
    
    words.forEach(word => {
      wordFreq.set(word, (wordFreq.get(word) || 0) + 1);
    });

    return Array.from(wordFreq.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }

  /**
   * Analyze member activity
   */
  private analyzeMemberActivity(
    members: GroupMember[],
    messages: any[]
  ): MemberActivity[] {
    const activity: MemberActivity[] = [];

    for (const member of members) {
      const memberMessages = messages.filter(m => m.sender === member.userId);
      const messageCount = memberMessages.length;
      const lastMessage = memberMessages[memberMessages.length - 1];
      const lastActive = lastMessage ? new Date(lastMessage.timestamp) : member.joinedAt;

      let engagementLevel: 'high' | 'medium' | 'low';
      if (messageCount > 20) engagementLevel = 'high';
      else if (messageCount > 5) engagementLevel = 'medium';
      else engagementLevel = 'low';

      activity.push({
        userId: member.userId,
        displayName: member.displayName,
        messageCount,
        lastActive,
        engagementLevel,
      });
    }

    return activity;
  }

  /**
   * Find unresolved questions
   */
  private async findUnresolvedQuestions(messages: any[]): Promise<UnresolvedQuestion[]> {
    const questions: UnresolvedQuestion[] = [];
    const questionPattern = /\?/;

    for (const message of messages) {
      if (questionPattern.test(message.content)) {
        // Check if answered (simplified: look for responses from others)
        const messageIndex = messages.indexOf(message);
        const subsequentMessages = messages.slice(messageIndex + 1, messageIndex + 6);
        const hasResponse = subsequentMessages.some(m => m.sender !== message.sender);

        if (!hasResponse) {
          questions.push({
            question: message.content,
            askedBy: message.sender,
            timestamp: new Date(message.timestamp),
            context: message.content.substring(0, 200),
          });
        }
      }
    }

    return questions.slice(0, 10); // Return top 10
  }

  /**
   * Calculate engagement score (0-100)
   */
  private calculateEngagementScore(activity: MemberActivity[], totalMessages: number): number {
    const totalMembers = activity.length;
    if (totalMembers === 0) return 0;

    const activeMembers = activity.filter(a => a.messageCount > 0).length;
    const participationRate = (activeMembers / totalMembers) * 100;
    const messagesPerMember = totalMessages / totalMembers;

    // Score based on participation and activity
    const score = Math.min(100, (participationRate * 0.6) + (Math.min(messagesPerMember, 20) * 2));

    return Math.round(score);
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(
    activity: MemberActivity[],
    questions: UnresolvedQuestion[],
    score: number
  ): string[] {
    const recommendations: string[] = [];

    if (score < 30) {
      recommendations.push('Low engagement detected. Consider starting a discussion topic.');
    }

    const inactiveCount = activity.filter(a => a.engagementLevel === 'low').length;
    if (inactiveCount > activity.length * 0.5) {
      recommendations.push(`${inactiveCount} members are inactive. Consider engaging them directly.`);
    }

    if (questions.length > 5) {
      recommendations.push(`${questions.length} unanswered questions. Ensure important queries are addressed.`);
    }

    const highlyActive = activity.filter(a => a.engagementLevel === 'high').length;
    if (highlyActive > 0) {
      recommendations.push(`${highlyActive} highly engaged members. Great group participation!`);
    }

    if (recommendations.length === 0) {
      recommendations.push('Group engagement is healthy. Keep up the good communication!');
    }

    return recommendations;
  }
}
