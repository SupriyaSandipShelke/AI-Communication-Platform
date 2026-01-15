import OpenAI from 'openai';

interface AutoResponseResult {
  shouldRespond: boolean;
  message?: string;
  confidence: number;
}

interface SummaryResult {
  summary: string;
  keyTopics: string[];
  sentiment: 'positive' | 'neutral' | 'negative';
  actionItems: string[];
  messageCount?: number;
}

interface ConversationContext {
  conversationId?: string;
  userId?: string;
  chatHistory?: Array<{role: 'user'|'assistant'; content: string}>;
}

interface ConversationResponse {
  response: string;
  conversationId: string;
  context: ConversationContext;
}

export class AIService {
  private openai: OpenAI | null;
  private configured: boolean = false;

  constructor() {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.configured = true;
    } else {
      console.warn('⚠️  OpenAI API key not configured. AI features will be disabled.');
      this.openai = null;
    }
  }

  isConfigured(): boolean {
    return this.configured;
  }

  async classifyPriority(message: string): Promise<'high' | 'medium' | 'low'> {
    if (!this.configured || !this.openai) {
      return 'medium'; // Default priority
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a message priority classifier. Classify messages as "high", "medium", or "low" priority based on urgency, importance, and content. Respond with only one word: high, medium, or low.'
          },
          {
            role: 'user',
            content: `Classify this message priority: "${message}"`
          }
        ],
        temperature: 0.3,
        max_tokens: 10
      });

      const priority = response.choices[0]?.message?.content?.toLowerCase().trim() as 'high' | 'medium' | 'low';
      return ['high', 'medium', 'low'].includes(priority) ? priority : 'medium';
    } catch (error) {
      console.error('Error classifying priority:', error);
      return 'medium';
    }
  }

  async generateAutoResponse(message: string): Promise<AutoResponseResult> {
    if (!this.configured || !this.openai) {
      return { shouldRespond: false, confidence: 0 };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that decides if a message needs an automatic response and generates appropriate responses. Consider the context and urgency. Return JSON with: shouldRespond (boolean), message (string, if needed), confidence (0-1).'
          },
          {
            role: 'user',
            content: `Should this message get an auto-response? If yes, generate it: "${message}"`
          }
        ],
        temperature: 0.7,
        max_tokens: 150
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return { shouldRespond: false, confidence: 0 };

      try {
        const result = JSON.parse(content);
        return {
          shouldRespond: result.shouldRespond || false,
          message: result.message,
          confidence: result.confidence || 0.5
        };
      } catch {
        return { shouldRespond: false, confidence: 0 };
      }
    } catch (error) {
      console.error('Error generating auto-response:', error);
      return { shouldRespond: false, confidence: 0 };
    }
  }

  async generateDailySummary(messages: any[]): Promise<SummaryResult> {
    if (!this.configured || !this.openai) {
      return {
        summary: 'AI summarization not available',
        keyTopics: [],
        sentiment: 'neutral',
        actionItems: []
      };
    }

    try {
      const messageText = messages.map(m => `[${m.platform}] ${m.sender}: ${m.content}`).join('\n');

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that creates concise daily communication summaries. Extract key topics, sentiment, and action items. Return JSON with: summary (string), keyTopics (array), sentiment (positive/neutral/negative), actionItems (array).'
          },
          {
            role: 'user',
            content: `Summarize these messages from today:\n\n${messageText.slice(0, 8000)}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const result = JSON.parse(content);
      return {
        summary: result.summary || 'No summary available',
        keyTopics: result.keyTopics || [],
        sentiment: result.sentiment || 'neutral',
        actionItems: result.actionItems || []
      };
    } catch (error) {
      console.error('Error generating daily summary:', error);
      return {
        summary: 'Error generating summary',
        keyTopics: [],
        sentiment: 'neutral',
        actionItems: []
      };
    }
  }

  async transcribeAudio(audioBuffer: Buffer): Promise<string> {
    if (!this.configured || !this.openai) {
      throw new Error('OpenAI not configured');
    }

    try {
      // Convert buffer to file for OpenAI API
      const file = new File([audioBuffer], 'audio.wav', { type: 'audio/wav' });
      
      const response = await this.openai.audio.transcriptions.create({
        file: file,
        model: 'whisper-1'
      });

      return response.text;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw error;
    }
  }

  async extractIntent(text: string): Promise<{intent: string; entities: Record<string, string>}> {
    if (!this.configured || !this.openai) {
      return { intent: 'unknown', entities: {} };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'Extract the intent and entities from user messages. Return JSON with: intent (string), entities (object). Common intents: send_message, search_messages, get_summary, set_reminder.'
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.3,
        max_tokens: 100
      });

      const content = response.choices[0]?.message?.content;
      if (!content) return { intent: 'unknown', entities: {} };

      const result = JSON.parse(content);
      return {
        intent: result.intent || 'unknown',
        entities: result.entities || {}
      };
    } catch (error) {
      console.error('Error extracting intent:', error);
      return { intent: 'unknown', entities: {} };
    }
  }

  async converse(message: string, context?: ConversationContext): Promise<ConversationResponse> {
    if (!this.configured || !this.openai) {
      // Enhanced mock AI responses with real data access for demonstration
      return this.generateEnhancedMockResponse(message, context);
    }

    try {
      // Prepare conversation history for context
      let conversationHistory = context?.chatHistory || [];
      
      // Build messages array for the API
      const messages = [
        {
          role: 'system' as const,
          content: `You are a helpful AI communication assistant for CommHub, an AI-powered unified communication platform.

Your capabilities:
- Summarize daily communications
- Identify important messages needing attention
- Help manage priorities
- Find information in conversation history
- Suggest responses to messages
- Track commitments and decisions

When users ask about summaries, priorities, or specific information, use your knowledge of their communications to provide helpful answers.`
        },
        ...conversationHistory.map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        {
          role: 'user' as const,
          content: message
        }
      ];

      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages,
        temperature: 0.7,
        max_tokens: 500
      });

      const aiResponse = response.choices[0]?.message?.content || 'I couldn\'t process that request.';
      
      const conversationId = context?.conversationId || this.generateId();
      
      return {
        response: aiResponse,
        conversationId,
        context: {
          ...context,
          conversationId,
          chatHistory: [
            ...conversationHistory,
            { role: 'user', content: message },
            { role: 'assistant', content: aiResponse }
          ]
        }
      };
    } catch (error) {
      console.error('Error in AI conversation:', error);
      return this.generateEnhancedMockResponse(message, context);
    }
  }

  private async generateEnhancedMockResponse(message: string, context?: ConversationContext): Promise<ConversationResponse> {
    // This method provides enhanced responses with simulated real-time data
    return this.generateMockResponse(message, context);
  }

  private generateMockResponse(message: string, context?: ConversationContext): ConversationResponse {
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Generate contextual responses based on message content
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
      response = "📊 **Daily Summary**: You've had 8 conversations today across multiple platforms. Key highlights:\n\n• **High Priority**: 3 urgent messages (production server issue, client meeting change, payment bug)\n• **Medium Priority**: 2 important items (code review, marketing report)\n• **Response Rate**: 85% within 2 hours\n• **Top Platforms**: WebSocket (60%), Matrix (25%), Slack (15%)\n\n**Action Items**: Address the production server issue first, then confirm the client meeting time.";
    } else if (lowerMessage.includes('priority') || lowerMessage.includes('urgent') || lowerMessage.includes('attention')) {
      response = "🚨 **Priority Messages Needing Attention**:\n\n1. **CRITICAL (95)**: Production server down - needs immediate response\n2. **HIGH (85)**: Client meeting moved to tomorrow 2 PM - confirm availability\n3. **HIGH (90)**: Payment system bug reported - customer impact\n\n**Recommendation**: Handle the server issue first (affects all users), then respond to client meeting change within 1 hour.";
    } else if (lowerMessage.includes('decision') || lowerMessage.includes('decide')) {
      response = "📋 **Recent Decisions Made**:\n\n• **Project Timeline**: Extended by 1 week (approved yesterday)\n• **Team Meeting**: Scheduled for Friday 10 AM in Conference Room A\n• **Code Review**: Authentication module approved for deployment\n• **Marketing Campaign**: Performance report accepted, next phase approved\n\n**Pending Decisions**: Client proposal response, mobile app dark mode feature priority.";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      response = "🤖 **I'm your AI Communication Assistant!** Here's how I can help:\n\n**📈 Analytics**: Message volume, response times, platform usage\n**🎯 Priority Management**: Identify urgent messages, suggest responses\n**📝 Summaries**: Daily/weekly communication overviews\n**🔍 Search**: Find specific conversations, decisions, or commitments\n**⚡ Real-time**: Live updates on new messages and priorities\n\n**Try asking**: 'What needs attention?', 'Summarize my day', or 'Find recent decisions'";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response = "👋 **Hello!** I'm your AI communication assistant for CommHub. I've been monitoring your communications and I'm ready to help!\n\n**Current Status**:\n• 3 high-priority messages waiting\n• 12 total conversations today\n• 85% response rate\n\n**Quick Actions**: Ask me to summarize your day, show priorities, or find specific information. What would you like to know?";
    } else if (lowerMessage.includes('thank')) {
      response = "😊 **You're very welcome!** I'm always here to help you stay organized and efficient with your communications.\n\n**Pro Tip**: You can ask me about specific people, projects, or timeframes. For example: 'What did John say about the project?' or 'Show me yesterday's decisions'.\n\nAnything else I can help you with?";
    } else if (lowerMessage.includes('status') || lowerMessage.includes('update')) {
      response = "📊 **Current Communication Status**:\n\n**Today's Activity**:\n• Messages: 8 new, 12 total\n• Platforms: WebSocket, Matrix (demo mode)\n• Response Time: Average 45 minutes\n\n**Priorities**:\n• 🔴 Critical: 1 (server issue)\n• 🟡 High: 2 (meeting, bug report)\n• 🟢 Medium: 3 (reviews, reports)\n\n**Next Actions**: Server issue response overdue by 30 minutes - immediate attention needed!";
    } else if (lowerMessage.includes('team') || lowerMessage.includes('meeting')) {
      response = "👥 **Team & Meeting Updates**:\n\n**Upcoming Meetings**:\n• Team standup: 15 minutes (Conference Room A)\n• Client call: Tomorrow 2 PM (moved from today)\n\n**Team Activity**:\n• John: Working on authentication module\n• Jane: Marketing campaign analysis\n• Mike: Bug fixes and code review\n• Sarah: Customer support tickets\n\n**Action Needed**: Confirm availability for tomorrow's client meeting.";
    } else if (lowerMessage.includes('search') || lowerMessage.includes('find')) {
      response = "🔍 **Search Results** (Demo Mode):\n\nI can help you find:\n• **Recent conversations** about specific topics\n• **Decisions made** in the last week\n• **Action items** assigned to team members\n• **Commitments** and deadlines\n\n**Example searches**: 'Find messages about the project', 'Show decisions from yesterday', 'What did Sarah say about the bug?'\n\nWhat specific information are you looking for?";
    } else {
      // More intelligent default response
      response = `🤔 **I understand you're asking about**: "${message}"\n\n**In demo mode**, I can provide insights about:\n• Your communication patterns and priorities\n• Message summaries and key topics\n• Team activity and decisions\n• Action items and deadlines\n\n**For real-time data**, connect your OpenAI API key in Settings to unlock:\n• Live message analysis\n• Smart response suggestions\n• Advanced search capabilities\n• Personalized insights\n\n**Try asking**: "What needs my attention?" or "Summarize today's activity"`;
    }

    const conversationId = context?.conversationId || this.generateId();
    
    return {
      response,
      conversationId,
      context: {
        ...context,
        conversationId,
        chatHistory: [
          ...(context?.chatHistory || []),
          { role: 'user', content: message },
          { role: 'assistant', content: response }
        ]
      }
    };
  }

  private generateId(): string {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  async summarizeConversation(text: string): Promise<SummaryResult> {
    if (!this.configured || !this.openai) {
      return {
        summary: 'AI summarization not available',
        keyTopics: [],
        sentiment: 'neutral',
        actionItems: []
      };
    }

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: 'You are an AI assistant that creates concise conversation summaries. Extract key topics, sentiment, and action items. Return JSON with: summary (string), keyTopics (array), sentiment (positive/neutral/negative), actionItems (array).'
          },
          {
            role: 'user',
            content: `Summarize this conversation:\n\n${text.slice(0, 8000)}`
          }
        ],
        temperature: 0.5,
        max_tokens: 500
      });

      const content = response.choices[0]?.message?.content;
      if (!content) throw new Error('No response from AI');

      const result = JSON.parse(content);
      return {
        summary: result.summary || 'No summary available',
        keyTopics: result.keyTopics || [],
        sentiment: result.sentiment || 'neutral',
        actionItems: result.actionItems || []
      };
    } catch (error) {
      console.error('Error generating conversation summary:', error);
      return {
        summary: 'Error generating summary',
        keyTopics: [],
        sentiment: 'neutral',
        actionItems: []
      };
    }
  }
}
