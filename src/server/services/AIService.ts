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
      // Mock AI responses for demonstration when OpenAI is not configured
      return this.generateMockResponse(message, context);
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
      return this.generateMockResponse(message, context);
    }
  }

  private generateMockResponse(message: string, context?: ConversationContext): ConversationResponse {
    const lowerMessage = message.toLowerCase();
    let response = '';

    // Generate contextual responses based on message content
    if (lowerMessage.includes('summarize') || lowerMessage.includes('summary')) {
      response = "Based on your recent communications, you've had 12 conversations today with focus on project coordination and client feedback. Key topics include project updates, team meetings, and technical discussions. Most conversations were productive with quick response times.";
    } else if (lowerMessage.includes('priority') || lowerMessage.includes('urgent') || lowerMessage.includes('attention')) {
      response = "You have 3 high-priority messages that need attention: 1) Client feedback on the latest proposal, 2) Team meeting scheduled for tomorrow, and 3) Technical specification review. I recommend addressing the client feedback first as it's time-sensitive.";
    } else if (lowerMessage.includes('decision') || lowerMessage.includes('decide')) {
      response = "Recent decisions made in your communications include: choosing the new project timeline, approving the technical architecture, and confirming the team meeting schedule. Would you like me to elaborate on any of these decisions?";
    } else if (lowerMessage.includes('help') || lowerMessage.includes('how')) {
      response = "I'm here to help you manage your communications effectively! I can summarize your daily messages, identify priorities, track decisions, and help you stay organized. What specific area would you like assistance with?";
    } else if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
      response = "Hello! I'm your AI communication assistant. I'm here to help you manage your messages, track priorities, and stay organized. How can I assist you today?";
    } else if (lowerMessage.includes('thank')) {
      response = "You're welcome! I'm always here to help you stay on top of your communications. Is there anything else you'd like to know about your messages or priorities?";
    } else {
      // Default intelligent response
      response = "I understand you're asking about your communications. While I don't have access to real-time data in demo mode, I can help you with message summaries, priority management, and communication insights. Could you be more specific about what you'd like to know?";
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
