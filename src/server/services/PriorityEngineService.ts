import OpenAI from 'openai';
import { DatabaseService } from './DatabaseService.js';

interface PriorityScore {
  score: number; // 0-100
  label: 'URGENT' | 'IMPORTANT' | 'FOLLOW_UP' | 'NORMAL' | 'LOW';
  reasons: string[];
  factors: {
    hasDeadline: boolean;
    mentionsMoney: boolean;
    mentionsMeeting: boolean;
    isFromVIP: boolean;
    isUnanswered: boolean;
    hasEscalatingSentiment: boolean;
    isRepeatedFollowUp: boolean;
    urgencyKeywords: number;
  };
  sentiment: 'positive' | 'neutral' | 'negative' | 'urgent';
  suggestedAction: string;
}

interface PriorityInboxItem {
  messageId: string;
  roomId: string;
  sender: string;
  content: string;
  timestamp: Date;
  priorityScore: number;
  priorityLabel: string;
  reasons: string[];
  isRead: boolean;
}

/**
 * AI Conversation Priority Engine
 * 
 * Automatically detects and scores message importance using:
 * - Deadline detection
 * - Financial keywords
 * - Meeting mentions
 * - VIP contacts
 * - Sentiment analysis
 * - Follow-up patterns
 * - Urgency indicators
 */
export class PriorityEngineService {
  private openai: OpenAI | null;
  private configured: boolean = false;
  private vipContacts: Set<string> = new Set();
  private dbService: DatabaseService;
  
  // Urgency keyword patterns
  private readonly urgencyPatterns = [
    /\basap\b/i,
    /\burgent\b/i,
    /\bemergency\b/i,
    /\bcritical\b/i,
    /\bimmediate\b/i,
    /\btoday\b/i,
    /\bright now\b/i,
    /\bdeadline\b/i,
    /\boverdue\b/i,
    /\basap\b/i,
  ];

  private readonly deadlinePatterns = [
    /\bby\s+(?:today|tomorrow|tonight|eod|end of day)\b/i,
    /\bdue\s+(?:by|on|before)\b/i,
    /\bdeadline\b/i,
    /\bin\s+\d+\s+(?:hour|day|minute)s?\b/i,
    /\bbefore\s+\d+(?:am|pm)\b/i,
  ];

  private readonly moneyPatterns = [
    /\$\d+/,
    /\d+\s*(?:usd|eur|gbp|dollars?|euros?|pounds?)\b/i,
    /\b(?:payment|invoice|budget|cost|price|funding|investment)\b/i,
    /\b(?:revenue|profit|loss|expense)\b/i,
  ];

  private readonly meetingPatterns = [
    /\bmeeting\b/i,
    /\bcall\b/i,
    /\bzoom\b/i,
    /\bteams\b/i,
    /\b(?:catch up|sync|standup|1:1|one on one)\b/i,
    /\bschedule\b/i,
    /\bavailable\b/i,
  ];

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.configured = true;
    } else {
      console.warn('⚠️  Priority Engine: OpenAI API key not configured');
      this.openai = null;
    }
  }

  /**
   * Add VIP contact for priority scoring
   */
  addVIPContact(contactId: string): void {
    this.vipContacts.add(contactId.toLowerCase());
  }

  /**
   * Remove VIP contact
   */
  removeVIPContact(contactId: string): void {
    this.vipContacts.delete(contactId.toLowerCase());
  }

  /**
   * Evaluate message priority
   */
  async evaluatePriority(
    content: string,
    sender: string,
    roomId: string,
    previousMessages?: string[]
  ): Promise<PriorityScore> {
    // Basic factor detection
    const factors = {
      hasDeadline: this.detectDeadline(content),
      mentionsMoney: this.detectMoney(content),
      mentionsMeeting: this.detectMeeting(content),
      isFromVIP: this.vipContacts.has(sender.toLowerCase()),
      isUnanswered: false, // Will be set by caller
      hasEscalatingSentiment: false,
      isRepeatedFollowUp: this.detectRepeatedFollowUp(content, previousMessages),
      urgencyKeywords: this.countUrgencyKeywords(content),
    };

    // Calculate base score
    let score = 50; // Start at neutral

    if (factors.hasDeadline) score += 20;
    if (factors.mentionsMoney) score += 15;
    if (factors.mentionsMeeting) score += 10;
    if (factors.isFromVIP) score += 15;
    if (factors.urgencyKeywords > 0) score += factors.urgencyKeywords * 10;
    if (factors.isRepeatedFollowUp) score += 15;

    // AI-enhanced analysis if configured
    if (this.configured && this.openai) {
      try {
        const aiAnalysis = await this.analyzeWithAI(content, factors);
        score = Math.round((score + aiAnalysis.score) / 2); // Average rule-based and AI
        factors.hasEscalatingSentiment = aiAnalysis.escalating;
      } catch (error) {
        console.warn('AI analysis failed, using rule-based score:', error);
      }
    }

    // Clamp score between 0-100
    score = Math.max(0, Math.min(100, score));

    // Determine label
    let label: PriorityScore['label'];
    if (score >= 80) label = 'URGENT';
    else if (score >= 65) label = 'IMPORTANT';
    else if (score >= 50) label = 'FOLLOW_UP';
    else if (score >= 30) label = 'NORMAL';
    else label = 'LOW';

    // Generate reasons
    const reasons: string[] = [];
    if (factors.hasDeadline) reasons.push('Contains deadline or time-sensitive language');
    if (factors.mentionsMoney) reasons.push('Discusses financial matters');
    if (factors.mentionsMeeting) reasons.push('Mentions meeting or scheduling');
    if (factors.isFromVIP) reasons.push('From VIP contact');
    if (factors.urgencyKeywords > 0) reasons.push(`Contains ${factors.urgencyKeywords} urgency indicator(s)`);
    if (factors.isRepeatedFollowUp) reasons.push('Appears to be a follow-up message');
    if (factors.hasEscalatingSentiment) reasons.push('Escalating or negative sentiment detected');

    // Determine sentiment
    const sentiment = this.analyzeSentiment(content, factors);

    // Suggested action
    const suggestedAction = this.generateSuggestedAction(label, factors);

    return {
      score,
      label,
      reasons,
      factors,
      sentiment,
      suggestedAction,
    };
  }

  /**
   * Get priority inbox (high-priority unread messages)
   */
  async getPriorityInbox(userId: string, limit: number = 50): Promise<PriorityInboxItem[]> {
    // This would typically query from database
    // For now, return structure
    const messages = await this.dbService.getMessages({
      limit,
      // Add user filter when user system is implemented
    });

    const priorityItems: PriorityInboxItem[] = [];

    for (const msg of messages) {
      const priority = await this.evaluatePriority(
        msg.content,
        msg.sender,
        msg.roomId
      );

      if (priority.score >= 50) { // Only include important+ messages
        priorityItems.push({
          messageId: (msg as any).id || '',
          roomId: msg.roomId,
          sender: msg.sender,
          content: msg.content,
          timestamp: msg.timestamp,
          priorityScore: priority.score,
          priorityLabel: priority.label,
          reasons: priority.reasons,
          isRead: false,
        });
      }
    }

    // Sort by priority score descending
    priorityItems.sort((a, b) => b.priorityScore - a.priorityScore);

    return priorityItems.slice(0, limit);
  }

  /**
   * Detect deadline language
   */
  private detectDeadline(content: string): boolean {
    return this.deadlinePatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect money/financial mentions
   */
  private detectMoney(content: string): boolean {
    return this.moneyPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Detect meeting mentions
   */
  private detectMeeting(content: string): boolean {
    return this.meetingPatterns.some(pattern => pattern.test(content));
  }

  /**
   * Count urgency keywords
   */
  private countUrgencyKeywords(content: string): number {
    return this.urgencyPatterns.filter(pattern => pattern.test(content)).length;
  }

  /**
   * Detect repeated follow-ups
   */
  private detectRepeatedFollowUp(content: string, previousMessages?: string[]): boolean {
    const followUpPatterns = [
      /\bfollow(?:ing)?\s+up\b/i,
      /\bjust checking\b/i,
      /\bdid you (?:get|see|receive)\b/i,
      /\bany update\b/i,
      /\bstill waiting\b/i,
      /\bgentle reminder\b/i,
    ];

    const hasFollowUpLanguage = followUpPatterns.some(p => p.test(content));
    
    if (previousMessages && previousMessages.length > 0) {
      // Check if similar message was sent recently
      const similarCount = previousMessages.filter(msg => 
        this.calculateSimilarity(content, msg) > 0.6
      ).length;
      return hasFollowUpLanguage || similarCount > 0;
    }

    return hasFollowUpLanguage;
  }

  /**
   * Simple text similarity (Jaccard similarity)
   */
  private calculateSimilarity(text1: string, text2: string): number {
    const words1 = new Set(text1.toLowerCase().split(/\s+/));
    const words2 = new Set(text2.toLowerCase().split(/\s+/));
    
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    const union = new Set([...words1, ...words2]);
    
    return intersection.size / union.size;
  }

  /**
   * AI-enhanced priority analysis
   */
  private async analyzeWithAI(content: string, factors: any): Promise<{ score: number; escalating: boolean }> {
    if (!this.openai) {
      return { score: 50, escalating: false };
    }

    const prompt = `Analyze this message for priority and urgency. Consider:
- Deadlines or time-sensitive content
- Emotional tone (anger, frustration, urgency)
- Business importance
- Request for action

Message: "${content}"

Detected factors: ${JSON.stringify(factors)}

Respond with JSON only:
{
  "priority_score": <number 0-100>,
  "is_escalating": <boolean>,
  "urgency_reason": "<brief explanation>"
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 200,
      });

      const result = JSON.parse(response.choices[0].message.content || '{}');
      return {
        score: result.priority_score || 50,
        escalating: result.is_escalating || false,
      };
    } catch (error) {
      console.error('AI priority analysis failed:', error);
      return { score: 50, escalating: false };
    }
  }

  /**
   * Analyze sentiment
   */
  private analyzeSentiment(content: string, factors: any): 'positive' | 'neutral' | 'negative' | 'urgent' {
    if (factors.urgencyKeywords > 1) return 'urgent';
    
    const negativeWords = /(angry|frustrated|disappointed|upset|problem|issue|concern|worried)/i;
    const positiveWords = /(great|excellent|thank|appreciate|love|perfect|amazing)/i;
    
    if (negativeWords.test(content)) return 'negative';
    if (positiveWords.test(content)) return 'positive';
    return 'neutral';
  }

  /**
   * Generate suggested action
   */
  private generateSuggestedAction(label: string, factors: any): string {
    if (label === 'URGENT') {
      return 'Respond immediately - high priority';
    } else if (label === 'IMPORTANT') {
      if (factors.mentionsMeeting) return 'Review and schedule meeting';
      if (factors.hasDeadline) return 'Note deadline and respond today';
      return 'Respond within 2 hours';
    } else if (label === 'FOLLOW_UP') {
      return 'Respond when convenient - follow-up detected';
    } else {
      return 'Review later';
    }
  }
}
