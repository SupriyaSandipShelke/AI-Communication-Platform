import OpenAI from 'openai';
import { DatabaseService } from './DatabaseService.js';
import { AIService } from './AIService.js';
import { VectorSearchService } from './VectorSearchService.js';
import { AutoReplyService } from './AutoReplyService.js';
import fs from 'fs';
import path from 'path';

interface VoiceCommand {
  id: string;
  audioFile?: string;
  transcription: string;
  intent: string;
  entities: Record<string, any>;
  action: string;
  result: any;
  confidence: number;
  timestamp: Date;
}

interface CommandAction {
  type: 'summarize' | 'reply' | 'search' | 'query' | 'schedule' | 'unknown';
  target?: string;
  parameters?: Record<string, any>;
}

/**
 * Voice-to-AI Command Assistant
 * 
 * Features:
 * - Speech-to-text transcription (Whisper AI)
 * - Intent detection from voice commands
 * - Action execution (summarize, reply, search)
 * - Natural language understanding
 * - Privacy-focused voice processing
 */
export class VoiceCommandService {
  private openai: OpenAI | null;
  private configured: boolean = false;
  private dbService: DatabaseService;
  private aiService: AIService;
  private searchService: VectorSearchService;
  private replyService: AutoReplyService;

  // Command patterns for intent detection
  private readonly commandPatterns = {
    summarize: [
      /summarize\s+(?:today's?|recent|all|my)\s+messages?/i,
      /give me (?:a )?summary/i,
      /what did (?:i|we) discuss/i,
      /catch me up/i,
    ],
    reply: [
      /reply to (\w+)\s+(?:that|saying)?/i,
      /send (?:a )?message to (\w+)/i,
      /tell (\w+)/i,
      /respond to (\w+)/i,
    ],
    search: [
      /search for (.+)/i,
      /find (?:messages?|conversations?) about (.+)/i,
      /what did (?:i|we) say about (.+)/i,
      /when did (?:i|we) (?:discuss|talk about) (.+)/i,
    ],
    schedule: [
      /schedule (?:a )?meeting with (\w+)/i,
      /set (?:up )?(?:a )?call with/i,
      /when am i free/i,
    ],
  };

  constructor(
    dbService: DatabaseService,
    aiService: AIService,
    searchService: VectorSearchService,
    replyService: AutoReplyService
  ) {
    this.dbService = dbService;
    this.aiService = aiService;
    this.searchService = searchService;
    this.replyService = replyService;

    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.configured = true;
    } else {
      console.warn('⚠️  Voice Command Service: OpenAI API key not configured');
      this.openai = null;
    }
  }

  /**
   * Process voice command from audio file
   */
  async processVoiceCommand(
    audioFilePath: string,
    userId?: string
  ): Promise<VoiceCommand> {
    const commandId = this.generateCommandId();

    try {
      // Step 1: Transcribe audio to text
      const transcription = await this.transcribeAudio(audioFilePath);

      if (!transcription) {
        return {
          id: commandId,
          audioFile: audioFilePath,
          transcription: '',
          intent: 'unknown',
          entities: {},
          action: 'error',
          result: { error: 'Transcription failed' },
          confidence: 0,
          timestamp: new Date(),
        };
      }

      // Step 2: Detect intent and extract entities
      const { intent, entities, confidence } = await this.detectIntent(transcription);

      // Step 3: Execute action based on intent
      const action = this.mapIntentToAction(intent, entities);
      const result = await this.executeAction(action, userId);

      const command: VoiceCommand = {
        id: commandId,
        audioFile: audioFilePath,
        transcription,
        intent,
        entities,
        action: action.type,
        result,
        confidence,
        timestamp: new Date(),
      };

      return command;
    } catch (error: any) {
      return {
        id: commandId,
        audioFile: audioFilePath,
        transcription: '',
        intent: 'error',
        entities: {},
        action: 'error',
        result: { error: error.message },
        confidence: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Process text command (for testing or text-based voice input)
   */
  async processTextCommand(text: string, userId?: string): Promise<VoiceCommand> {
    const commandId = this.generateCommandId();

    try {
      const { intent, entities, confidence } = await this.detectIntent(text);
      const action = this.mapIntentToAction(intent, entities);
      const result = await this.executeAction(action, userId);

      return {
        id: commandId,
        transcription: text,
        intent,
        entities,
        action: action.type,
        result,
        confidence,
        timestamp: new Date(),
      };
    } catch (error: any) {
      return {
        id: commandId,
        transcription: text,
        intent: 'error',
        entities: {},
        action: 'error',
        result: { error: error.message },
        confidence: 0,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Transcribe audio using Whisper AI
   */
  private async transcribeAudio(audioFilePath: string): Promise<string> {
    if (!this.configured || !this.openai) {
      throw new Error('OpenAI not configured for transcription');
    }

    try {
      // Read audio file
      const audioFile = fs.createReadStream(audioFilePath);

      // Call Whisper API
      const response = await this.openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
        language: 'en', // Can be auto-detected
      });

      return response.text;
    } catch (error: any) {
      console.error('Transcription failed:', error);
      throw new Error(`Transcription failed: ${error.message}`);
    }
  }

  /**
   * Detect intent from transcribed text
   */
  private async detectIntent(text: string): Promise<{
    intent: string;
    entities: Record<string, any>;
    confidence: number;
  }> {
    // Rule-based intent detection first
    const ruleBasedIntent = this.detectIntentRuleBased(text);

    if (ruleBasedIntent.confidence > 0.7) {
      return ruleBasedIntent;
    }

    // Fall back to AI-based intent detection if configured
    if (this.configured && this.openai) {
      try {
        return await this.detectIntentWithAI(text);
      } catch (error) {
        console.warn('AI intent detection failed, using rule-based:', error);
      }
    }

    return ruleBasedIntent;
  }

  /**
   * Rule-based intent detection
   */
  private detectIntentRuleBased(text: string): {
    intent: string;
    entities: Record<string, any>;
    confidence: number;
  } {
    const normalizedText = text.toLowerCase().trim();

    // Check each command pattern
    for (const [intent, patterns] of Object.entries(this.commandPatterns)) {
      for (const pattern of patterns) {
        const match = normalizedText.match(pattern);
        if (match) {
          const entities: Record<string, any> = {};
          
          // Extract entities from regex groups
          if (match[1]) {
            if (intent === 'reply') entities.recipient = match[1];
            else if (intent === 'search') entities.query = match[1];
            else if (intent === 'schedule') entities.person = match[1];
          }

          return {
            intent,
            entities,
            confidence: 0.8,
          };
        }
      }
    }

    return {
      intent: 'unknown',
      entities: {},
      confidence: 0.3,
    };
  }

  /**
   * AI-based intent detection
   */
  private async detectIntentWithAI(text: string): Promise<{
    intent: string;
    entities: Record<string, any>;
    confidence: number;
  }> {
    if (!this.openai) throw new Error('OpenAI not configured');

    const prompt = `Analyze this voice command and extract intent and entities.

Command: "${text}"

Possible intents: summarize, reply, search, schedule, query, unknown

Respond with JSON only:
{
  "intent": "<intent>",
  "entities": {<key-value pairs>},
  "confidence": <0-1>,
  "reasoning": "<brief explanation>"
}`;

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
      max_tokens: 300,
    });

    const result = JSON.parse(response.choices[0].message.content || '{}');

    return {
      intent: result.intent || 'unknown',
      entities: result.entities || {},
      confidence: result.confidence || 0.5,
    };
  }

  /**
   * Map intent to action
   */
  private mapIntentToAction(intent: string, entities: Record<string, any>): CommandAction {
    switch (intent) {
      case 'summarize':
        return {
          type: 'summarize',
          parameters: {
            timeframe: entities.timeframe || 'today',
          },
        };

      case 'reply':
        return {
          type: 'reply',
          target: entities.recipient,
          parameters: {
            message: entities.message,
          },
        };

      case 'search':
        return {
          type: 'search',
          parameters: {
            query: entities.query,
          },
        };

      case 'schedule':
        return {
          type: 'schedule',
          target: entities.person,
          parameters: {
            type: 'meeting',
          },
        };

      case 'query':
        return {
          type: 'query',
          parameters: {
            question: entities.question,
          },
        };

      default:
        return {
          type: 'unknown',
        };
    }
  }

  /**
   * Execute action based on detected intent
   */
  private async executeAction(action: CommandAction, userId?: string): Promise<any> {
    try {
      switch (action.type) {
        case 'summarize':
          return await this.executeSummarize(action.parameters);

        case 'reply':
          return await this.executeReply(action.target, action.parameters);

        case 'search':
          return await this.executeSearch(action.parameters);

        case 'schedule':
          return await this.executeSchedule(action.target, action.parameters);

        case 'query':
          return await this.executeQuery(action.parameters);

        default:
          return {
            success: false,
            message: 'Command not understood. Try: "Summarize today\'s messages" or "Search for messages about funding"',
          };
      }
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Execute summarize action
   */
  private async executeSummarize(params: any): Promise<any> {
    const timeframe = params?.timeframe || 'today';
    
    // Get messages from today
    const messages = await this.dbService.getMessages({
      limit: 100,
      // Add time filtering based on timeframe
    });

    if (messages.length === 0) {
      return {
        success: true,
        summary: 'No messages to summarize.',
      };
    }

    // Generate summary
    const allText = messages.map(m => `${m.sender}: ${m.content}`).join('\n');
    const summary = await this.aiService.summarizeConversation(allText);

    return {
      success: true,
      summary: summary.summary,
      messageCount: messages.length,
      keyTopics: summary.keyTopics,
    };
  }

  /**
   * Execute reply action
   */
  private async executeReply(recipient: string | undefined, params: any): Promise<any> {
    if (!recipient) {
      return {
        success: false,
        message: 'Recipient not specified',
      };
    }

    // Generate reply draft
    const draft = await this.replyService.suggestReply(
      params?.message || 'Quick response',
      {
        conversationHistory: [],
        senderName: recipient,
      },
      'casual'
    );

    return {
      success: true,
      message: `Draft reply created for ${recipient}. Please approve before sending.`,
      draft,
    };
  }

  /**
   * Execute search action
   */
  private async executeSearch(params: any): Promise<any> {
    const query = params?.query;

    if (!query) {
      return {
        success: false,
        message: 'Search query not specified',
      };
    }

    const results = await this.searchService.search(query, 5);

    return {
      success: true,
      query,
      results,
      count: results.length,
    };
  }

  /**
   * Execute schedule action
   */
  private async executeSchedule(person: string | undefined, params: any): Promise<any> {
    return {
      success: true,
      message: `Scheduling feature coming soon. Would schedule ${params?.type} with ${person}`,
    };
  }

  /**
   * Execute query action
   */
  private async executeQuery(params: any): Promise<any> {
    const question = params?.question;

    if (!question) {
      return {
        success: false,
        message: 'Question not specified',
      };
    }

    // Use semantic search to find relevant context
    const context = await this.searchService.search(question, 3);
    
    // Generate answer using AI
    if (this.configured && this.openai) {
      const contextText = context.map(r => r.content).join('\n\n');
      
      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [{
          role: 'user',
          content: `Answer this question based on the conversation context:

Question: ${question}

Context:
${contextText}`
        }],
        max_tokens: 200,
      });

      return {
        success: true,
        answer: response.choices[0].message.content,
        sources: context.length,
      };
    }

    return {
      success: true,
      message: 'Found relevant messages',
      results: context,
    };
  }

  /**
   * Generate unique command ID
   */
  private generateCommandId(): string {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}
