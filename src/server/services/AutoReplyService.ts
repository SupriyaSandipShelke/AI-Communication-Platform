import OpenAI from 'openai';
import { DatabaseService } from './DatabaseService.js';

interface ReplyDraft {
  id: string;
  originalMessage: string;
  draftContent: string;
  tone: 'formal' | 'casual' | 'concise' | 'friendly' | 'professional';
  confidence: number; // 0-100
  reasoning: string;
  alternatives: string[];
  requiresApproval: boolean;
  createdAt: Date;
}

interface ReplyContext {
  conversationHistory: string[];
  senderName: string;
  relationship?: 'colleague' | 'manager' | 'client' | 'friend' | 'unknown';
  previousTone?: string;
}

interface ApprovalRequest {
  draftId: string;
  approved: boolean;
  modifiedContent?: string;
  feedback?: string;
}

/**
 * AI Auto-Reply Draft Assistant
 * 
 * Features:
 * - Generates context-aware reply drafts
 * - Multiple tone options (formal, casual, concise)
 * - User approval required before sending
 * - Learns from user feedback
 * - Privacy-first: Never auto-sends without confirmation
 */
export class AutoReplyService {
  private openai: OpenAI | null;
  private configured: boolean = false;
  private dbService: DatabaseService;
  private pendingDrafts: Map<string, ReplyDraft> = new Map();

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.configured = true;
    } else {
      console.warn('⚠️  Auto-Reply Service: OpenAI API key not configured');
      this.openai = null;
    }
  }

  /**
   * Generate reply draft suggestion
   */
  async suggestReply(
    messageContent: string,
    context: ReplyContext,
    tone: ReplyDraft['tone'] = 'professional',
    generateAlternatives: boolean = true
  ): Promise<ReplyDraft> {
    if (!this.configured || !this.openai) {
      return this.generateFallbackReply(messageContent, tone);
    }

    try {
      // Build context for AI
      const contextPrompt = this.buildContextPrompt(messageContent, context, tone);

      // Generate primary draft
      const primaryDraft = await this.generateDraftWithAI(contextPrompt, tone);

      // Generate alternatives if requested
      const alternatives: string[] = [];
      if (generateAlternatives) {
        const tones: Array<ReplyDraft['tone']> = ['formal', 'casual', 'concise'];
        for (const altTone of tones) {
          if (altTone !== tone) {
            const altDraft = await this.generateDraftWithAI(contextPrompt, altTone);
            alternatives.push(altDraft);
          }
        }
      }

      // Create draft object
      const draft: ReplyDraft = {
        id: this.generateDraftId(),
        originalMessage: messageContent,
        draftContent: primaryDraft,
        tone,
        confidence: this.calculateConfidence(primaryDraft, messageContent),
        reasoning: this.explainReasoning(messageContent, tone, context),
        alternatives,
        requiresApproval: true,
        createdAt: new Date(),
      };

      // Store for approval workflow
      this.pendingDrafts.set(draft.id, draft);

      return draft;
    } catch (error) {
      console.error('AI draft generation failed:', error);
      return this.generateFallbackReply(messageContent, tone);
    }
  }

  /**
   * Generate quick acknowledgment reply
   */
  async suggestQuickReply(messageContent: string): Promise<string[]> {
    const quickReplies: string[] = [];

    // Rule-based quick replies
    if (/\?/.test(messageContent)) {
      quickReplies.push("Let me check and get back to you.");
      quickReplies.push("I'll look into this and respond shortly.");
    }

    if (/thank/i.test(messageContent)) {
      quickReplies.push("You're welcome!");
      quickReplies.push("Happy to help!");
      quickReplies.push("Anytime!");
    }

    if (/meeting|schedule|call/i.test(messageContent)) {
      quickReplies.push("Let me check my calendar and get back to you.");
      quickReplies.push("I'm available. What time works for you?");
    }

    if (/urgent|asap|immediate/i.test(messageContent)) {
      quickReplies.push("On it! I'll prioritize this.");
      quickReplies.push("Got it, working on this right away.");
    }

    // Add AI-generated quick replies if configured
    if (this.configured && this.openai && quickReplies.length < 3) {
      try {
        const aiQuickReplies = await this.generateQuickRepliesWithAI(messageContent);
        quickReplies.push(...aiQuickReplies);
      } catch (error) {
        console.warn('AI quick reply generation failed:', error);
      }
    }

    return quickReplies.slice(0, 5);
  }

  /**
   * Approve and send reply
   */
  async approveAndSend(
    approval: ApprovalRequest,
    roomId: string,
    sendCallback: (roomId: string, message: string) => Promise<void>
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    const draft = this.pendingDrafts.get(approval.draftId);

    if (!draft) {
      return { success: false, error: 'Draft not found or expired' };
    }

    if (!approval.approved) {
      // User rejected draft
      this.pendingDrafts.delete(approval.draftId);
      return { success: false, message: 'Draft rejected by user' };
    }

    try {
      // Use modified content if provided, otherwise use original draft
      const finalContent = approval.modifiedContent || draft.draftContent;

      // Send message via callback
      await sendCallback(roomId, finalContent);

      // Log approval for learning (future feature)
      if (approval.feedback) {
        await this.logFeedback(draft, approval.feedback);
      }

      // Clean up
      this.pendingDrafts.delete(approval.draftId);

      return { success: true, message: 'Reply sent successfully' };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  /**
   * Get pending drafts for user
   */
  getPendingDrafts(): ReplyDraft[] {
    return Array.from(this.pendingDrafts.values());
  }

  /**
   * Cancel draft
   */
  cancelDraft(draftId: string): boolean {
    return this.pendingDrafts.delete(draftId);
  }

  /**
   * Build context prompt for AI
   */
  private buildContextPrompt(
    message: string,
    context: ReplyContext,
    tone: string
  ): string {
    let prompt = `Generate a ${tone} reply to this message:

"${message}"

`;

    if (context.conversationHistory && context.conversationHistory.length > 0) {
      prompt += `Conversation context (last 3 messages):\n`;
      context.conversationHistory.slice(-3).forEach((msg, idx) => {
        prompt += `${idx + 1}. ${msg}\n`;
      });
      prompt += '\n';
    }

    if (context.relationship) {
      prompt += `Relationship: ${context.relationship}\n`;
    }

    prompt += `\nGuidelines:
- Keep it ${tone === 'concise' ? 'brief (1-2 sentences)' : 'appropriately detailed'}
- Match the ${tone} tone
- Be helpful and clear
- Don't make assumptions
${tone === 'formal' ? '- Use professional language' : ''}
${tone === 'casual' ? '- Use conversational language' : ''}

Reply:`;

    return prompt;
  }

  /**
   * Generate draft with AI
   */
  private async generateDraftWithAI(prompt: string, tone: string): Promise<string> {
    if (!this.openai) throw new Error('OpenAI not configured');

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [
        {
          role: 'system',
          content: `You are a helpful assistant that generates ${tone} email and message replies. Keep responses natural and context-appropriate.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 200,
    });

    return response.choices[0].message.content?.trim() || '';
  }

  /**
   * Generate quick replies with AI
   */
  private async generateQuickRepliesWithAI(message: string): Promise<string[]> {
    if (!this.openai) return [];

    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{
        role: 'user',
        content: `Generate 3 short (5-10 word) quick reply options for: "${message}"\n\nFormat as JSON array: ["reply1", "reply2", "reply3"]`
      }],
      temperature: 0.8,
      max_tokens: 150,
    });

    try {
      const content = response.choices[0].message.content || '[]';
      return JSON.parse(content);
    } catch {
      return [];
    }
  }

  /**
   * Calculate confidence score
   */
  private calculateConfidence(draft: string, original: string): number {
    // Simple heuristics - can be enhanced with ML
    let confidence = 60; // Base confidence

    if (draft.length > 20) confidence += 10;
    if (draft.length < 200) confidence += 10;
    if (!/\?\?/.test(draft)) confidence += 10; // No uncertainty markers
    if (draft.split(/[.!?]/).length > 1) confidence += 10; // Multiple sentences

    return Math.min(100, confidence);
  }

  /**
   * Explain reasoning for draft
   */
  private explainReasoning(message: string, tone: string, context: ReplyContext): string {
    const reasons: string[] = [];

    reasons.push(`Used ${tone} tone as requested`);

    if (context.relationship) {
      reasons.push(`Tailored for ${context.relationship} relationship`);
    }

    if (/\?/.test(message)) {
      reasons.push('Addressed question in original message');
    }

    if (/thank/i.test(message)) {
      reasons.push('Responded to gratitude');
    }

    return reasons.join('. ');
  }

  /**
   * Generate fallback reply when AI is unavailable
   */
  private generateFallbackReply(message: string, tone: string): ReplyDraft {
    let draftContent = '';

    // Simple rule-based fallback
    if (/\?/.test(message)) {
      draftContent = tone === 'formal' 
        ? "Thank you for your message. I will review this and respond shortly."
        : "Thanks for reaching out! Let me check on this and get back to you.";
    } else if (/thank/i.test(message)) {
      draftContent = tone === 'formal'
        ? "You're very welcome."
        : "You're welcome!";
    } else {
      draftContent = tone === 'formal'
        ? "Thank you for your message. I have received it and will respond as needed."
        : "Got it, thanks!";
    }

    return {
      id: this.generateDraftId(),
      originalMessage: message,
      draftContent,
      tone: tone as 'formal' | 'casual' | 'concise' | 'friendly' | 'professional',
      confidence: 40,
      reasoning: 'Generated using rule-based fallback (AI not configured)',
      alternatives: [],
      requiresApproval: true,
      createdAt: new Date(),
    };
  }

  /**
   * Generate unique draft ID
   */
  private generateDraftId(): string {
    return `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log feedback for future learning
   */
  private async logFeedback(draft: ReplyDraft, feedback: string): Promise<void> {
    // Store feedback for future ML training
    console.log('Feedback logged:', { draftId: draft.id, feedback });
    // In production, store in database for model fine-tuning
  }

  /**
   * Clean up expired drafts (older than 1 hour)
   */
  cleanupExpiredDrafts(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [id, draft] of this.pendingDrafts.entries()) {
      if (draft.createdAt.getTime() < oneHourAgo) {
        this.pendingDrafts.delete(id);
      }
    }
  }
}
