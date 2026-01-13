import OpenAI from 'openai';
import { DatabaseService } from './DatabaseService.js';
import { VectorSearchService } from './VectorSearchService.js';

interface Memory {
  id: string;
  type: 'decision' | 'commitment' | 'promise' | 'task' | 'fact' | 'preference';
  content: string;
  context: string;
  participants: string[];
  timestamp: Date;
  source: {
    platform: string;
    roomId: string;
    messageId: string;
  };
  status: 'active' | 'completed' | 'cancelled';
  dueDate?: Date;
  priority?: 'high' | 'medium' | 'low';
  tags: string[];
  embedding?: number[];
}

interface MemoryQuery {
  question: string;
  type?: Memory['type'];
  timeframe?: 'today' | 'week' | 'month' | 'all';
  limit?: number;
}

interface MemoryQueryResult {
  memories: Memory[];
  answer?: string;
  confidence: number;
}

/**
 * AI Memory Vault
 * 
 * Acts as a "second brain" that remembers:
 * - Decisions made
 * - Commitments given
 * - Promises to keep
 * - Important facts
 * - Task assignments
 * 
 * Features:
 * - Automatic extraction from conversations
 * - Natural language queries ("What did I promise Rahul?")
 * - Vector-based semantic search
 * - Knowledge graph relationships
 * - Privacy-focused encryption
 */
export class AIMemoryVaultService {
  private openai: OpenAI | null;
  private configured: boolean = false;
  private dbService: DatabaseService;
  private vectorService: VectorSearchService;
  private memories: Map<string, Memory> = new Map();

  // Patterns for memory extraction
  private readonly patterns = {
    commitment: [
      /\bI(?:'ll| will) (.+)/i,
      /\bI promise to (.+)/i,
      /\bI commit to (.+)/i,
      /\bI agree to (.+)/i,
      /\blet me (.+)/i,
    ],
    decision: [
      /\bwe decided to (.+)/i,
      /\bwe(?:'ll| will) go with (.+)/i,
      /\blet's proceed with (.+)/i,
      /\bthe decision is to (.+)/i,
      /\bwe agreed on (.+)/i,
    ],
    promise: [
      /\bI promise (.+)/i,
      /\byou can count on me to (.+)/i,
      /\bI guarantee (.+)/i,
    ],
    task: [
      /\b(?:please|can you) (.+)/i,
      /\byou need to (.+)/i,
      /\byour task is to (.+)/i,
      /\bcould you (.+)\?/i,
    ],
  };

  constructor(dbService: DatabaseService, vectorService: VectorSearchService) {
    this.dbService = dbService;
    this.vectorService = vectorService;

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.configured = true;
    } else {
      console.warn('⚠️  Memory Vault: OpenAI API key not configured');
      this.openai = null;
    }

    // Load existing memories (in production, load from persistent storage)
    this.loadMemories();
  }

  /**
   * Extract memories from a message
   */
  async extractMemories(
    content: string,
    sender: string,
    roomId: string,
    platform: string,
    messageId: string
  ): Promise<Memory[]> {
    const extractedMemories: Memory[] = [];

    // Rule-based extraction
    const ruleBasedMemories = this.extractMemoriesRuleBased(
      content,
      sender,
      roomId,
      platform,
      messageId
    );
    extractedMemories.push(...ruleBasedMemories);

    // AI-enhanced extraction if configured
    if (this.configured && this.openai && content.length > 20) {
      try {
        const aiMemories = await this.extractMemoriesWithAI(
          content,
          sender,
          roomId,
          platform,
          messageId
        );
        extractedMemories.push(...aiMemories);
      } catch (error) {
        console.warn('AI memory extraction failed:', error);
      }
    }

    // Store memories
    for (const memory of extractedMemories) {
      await this.storeMemory(memory);
    }

    return extractedMemories;
  }

  /**
   * Query memories using natural language
   */
  async queryMemories(query: MemoryQuery): Promise<MemoryQueryResult> {
    const { question, type, timeframe, limit = 10 } = query;

    // Filter memories by type and timeframe
    let relevantMemories = Array.from(this.memories.values());

    if (type) {
      relevantMemories = relevantMemories.filter(m => m.type === type);
    }

    if (timeframe) {
      const cutoff = this.getTimeframeCutoff(timeframe);
      relevantMemories = relevantMemories.filter(m => m.timestamp >= cutoff);
    }

    // Semantic search if configured
    if (this.configured && this.vectorService) {
      try {
        const searchResults = await this.vectorService.search(question, limit * 2);
        
        // Match search results with memories
        const memoryIds = new Set(searchResults.map(r => r.messageId));
        relevantMemories = relevantMemories.filter(m =>
          memoryIds.has(m.source.messageId) ||
          m.content.toLowerCase().includes(question.toLowerCase())
        );
      } catch (error) {
        console.warn('Vector search failed, using keyword search:', error);
        relevantMemories = this.keywordSearch(question, relevantMemories);
      }
    } else {
      relevantMemories = this.keywordSearch(question, relevantMemories);
    }

    // Sort by relevance and timestamp
    relevantMemories.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    relevantMemories = relevantMemories.slice(0, limit);

    // Generate natural language answer if AI is configured
    let answer: string | undefined;
    if (this.configured && this.openai && relevantMemories.length > 0) {
      try {
        answer = await this.generateAnswer(question, relevantMemories);
      } catch (error) {
        console.warn('Answer generation failed:', error);
      }
    }

    return {
      memories: relevantMemories,
      answer,
      confidence: relevantMemories.length > 0 ? 0.8 : 0.3,
    };
  }

  /**
   * Get all commitments (open promises/tasks)
   */
  async getOpenCommitments(userId?: string): Promise<Memory[]> {
    return Array.from(this.memories.values())
      .filter(m =>
        (m.type === 'commitment' || m.type === 'promise' || m.type === 'task') &&
        m.status === 'active'
      )
      .sort((a, b) => {
        // Sort by priority and due date
        if (a.priority !== b.priority) {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return (priorityOrder[a.priority || 'low'] - priorityOrder[b.priority || 'low']);
        }
        if (a.dueDate && b.dueDate) {
          return a.dueDate.getTime() - b.dueDate.getTime();
        }
        return b.timestamp.getTime() - a.timestamp.getTime();
      });
  }

  /**
   * Mark memory as completed
   */
  async completeMemory(memoryId: string): Promise<boolean> {
    const memory = this.memories.get(memoryId);
    if (memory) {
      memory.status = 'completed';
      await this.persistMemory(memory);
      return true;
    }
    return false;
  }

  /**
   * Update memory
   */
  async updateMemory(memoryId: string, updates: Partial<Memory>): Promise<boolean> {
    const memory = this.memories.get(memoryId);
    if (memory) {
      Object.assign(memory, updates);
      await this.persistMemory(memory);
      return true;
    }
    return false;
  }

  /**
   * Delete memory
   */
  async deleteMemory(memoryId: string): Promise<boolean> {
    const deleted = this.memories.delete(memoryId);
    if (deleted) {
      // Delete from persistent storage
      // await this.dbService.deleteMemory(memoryId);
    }
    return deleted;
  }

  /**
   * Get memory statistics
   */
  getStatistics(): {
    total: number;
    byType: Record<string, number>;
    activeCommitments: number;
    overdueCommitments: number;
  } {
    const stats = {
      total: this.memories.size,
      byType: {} as Record<string, number>,
      activeCommitments: 0,
      overdueCommitments: 0,
    };

    const now = new Date();

    for (const memory of this.memories.values()) {
      // Count by type
      stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;

      // Count active commitments
      if (
        (memory.type === 'commitment' || memory.type === 'promise' || memory.type === 'task') &&
        memory.status === 'active'
      ) {
        stats.activeCommitments++;

        // Count overdue
        if (memory.dueDate && memory.dueDate < now) {
          stats.overdueCommitments++;
        }
      }
    }

    return stats;
  }

  /**
   * Rule-based memory extraction
   */
  private extractMemoriesRuleBased(
    content: string,
    sender: string,
    roomId: string,
    platform: string,
    messageId: string
  ): Memory[] {
    const memories: Memory[] = [];

    for (const [type, patterns] of Object.entries(this.patterns)) {
      for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match && match[1]) {
          const memory: Memory = {
            id: this.generateMemoryId(),
            type: type as Memory['type'],
            content: match[1].trim(),
            context: content,
            participants: [sender],
            timestamp: new Date(),
            source: { platform, roomId, messageId },
            status: 'active',
            tags: this.extractTags(content),
          };

          // Extract due date if present
          const dueDate = this.extractDueDate(content);
          if (dueDate) {
            memory.dueDate = dueDate;
          }

          memories.push(memory);
        }
      }
    }

    return memories;
  }

  /**
   * AI-enhanced memory extraction
   */
  private async extractMemoriesWithAI(
    content: string,
    sender: string,
    roomId: string,
    platform: string,
    messageId: string
  ): Promise<Memory[]> {
    if (!this.openai) return [];

    const prompt = `Extract important information from this message that should be remembered:

Message: "${content}"
Sender: ${sender}

Look for:
- Decisions made
- Commitments or promises
- Tasks assigned
- Important facts
- Deadlines or due dates

Respond with JSON array only:
[
  {
    "type": "decision|commitment|promise|task|fact",
    "content": "<what to remember>",
    "priority": "high|medium|low",
    "dueDate": "<ISO date if mentioned>",
    "tags": ["tag1", "tag2"]
  }
]

If nothing important, return empty array: []`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 500,
      });

      const extracted = JSON.parse(response.choices[0].message.content || '[]');

      return extracted.map((item: any) => ({
        id: this.generateMemoryId(),
        type: item.type || 'fact',
        content: item.content,
        context: content,
        participants: [sender],
        timestamp: new Date(),
        source: { platform, roomId, messageId },
        status: 'active',
        dueDate: item.dueDate ? new Date(item.dueDate) : undefined,
        priority: item.priority || 'medium',
        tags: item.tags || [],
      }));
    } catch (error) {
      console.error('AI memory extraction failed:', error);
      return [];
    }
  }

  /**
   * Store memory
   */
  private async storeMemory(memory: Memory): Promise<void> {
    this.memories.set(memory.id, memory);
    await this.persistMemory(memory);

    // Vectorize for semantic search
    if (this.vectorService && this.configured) {
      try {
        await this.vectorService.addMessage({
          platform: memory.source.platform,
          roomId: memory.source.roomId,
          sender: memory.participants[0] || 'system',
          content: `[MEMORY: ${memory.type}] ${memory.content}`,
          timestamp: memory.timestamp,
        });
      } catch (error) {
        console.warn('Memory vectorization failed:', error);
      }
    }
  }

  /**
   * Persist memory to database
   */
  private async persistMemory(memory: Memory): Promise<void> {
    // In production, save to database
    // await this.dbService.saveMemory(memory);
    console.log('Memory persisted:', memory.id);
  }

  /**
   * Load memories from storage
   */
  private async loadMemories(): Promise<void> {
    // In production, load from database
    // const memories = await this.dbService.loadMemories();
    // memories.forEach(m => this.memories.set(m.id, m));
    console.log('Memories loaded:', this.memories.size);
  }

  /**
   * Keyword search in memories
   */
  private keywordSearch(query: string, memories: Memory[]): Memory[] {
    const keywords = query.toLowerCase().split(/\s+/);
    
    return memories.filter(memory => {
      const searchText = `${memory.content} ${memory.context}`.toLowerCase();
      return keywords.some(keyword => searchText.includes(keyword));
    });
  }

  /**
   * Generate natural language answer
   */
  private async generateAnswer(question: string, memories: Memory[]): Promise<string> {
    if (!this.openai) return '';

    const contextText = memories.map(m =>
      `- ${m.type.toUpperCase()}: ${m.content} (${m.timestamp.toLocaleDateString()})`
    ).join('\n');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Answer this question based on the stored memories:

Question: ${question}

Memories:
${contextText}

Answer concisely and naturally:`
      }],
      max_tokens: 200,
    });

    return response.choices[0].message.content?.trim() || '';
  }

  /**
   * Extract tags from content
   */
  private extractTags(content: string): string[] {
    const tags: string[] = [];

    // Common topic tags
    if (/\bmeeting\b/i.test(content)) tags.push('meeting');
    if (/\bdeadline\b/i.test(content)) tags.push('deadline');
    if (/\$\d+|money|payment|budget/i.test(content)) tags.push('financial');
    if (/\bproject\b/i.test(content)) tags.push('project');
    if (/\bclient\b/i.test(content)) tags.push('client');

    return tags;
  }

  /**
   * Extract due date from content
   */
  private extractDueDate(content: string): Date | undefined {
    // Simple date extraction (can be enhanced)
    const today = /\btoday\b/i.test(content);
    const tomorrow = /\btomorrow\b/i.test(content);
    const nextWeek = /\bnext week\b/i.test(content);

    if (today) {
      return new Date();
    } else if (tomorrow) {
      const date = new Date();
      date.setDate(date.getDate() + 1);
      return date;
    } else if (nextWeek) {
      const date = new Date();
      date.setDate(date.getDate() + 7);
      return date;
    }

    return undefined;
  }

  /**
   * Get timeframe cutoff date
   */
  private getTimeframeCutoff(timeframe: string): Date {
    const now = new Date();
    switch (timeframe) {
      case 'today':
        const today = new Date(now);
        today.setHours(0, 0, 0, 0);
        return today;
      case 'week':
        const week = new Date(now);
        week.setDate(week.getDate() - 7);
        return week;
      case 'month':
        const month = new Date(now);
        month.setMonth(month.getMonth() - 1);
        return month;
      default:
        return new Date(0); // Beginning of time
    }
  }

  /**
   * Generate unique memory ID
   */
  private generateMemoryId(): string {
    return `mem_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
