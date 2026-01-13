import OpenAI from 'openai';
import { DatabaseService } from './DatabaseService.js';

interface VectorSearchResult {
  messageId: string;
  content: string;
  sender: string;
  platform: string;
  timestamp: Date;
  similarity: number;
  roomId: string;
}

interface Embedding {
  id: string;
  vector: number[];
  metadata: {
    messageId: string;
    content: string;
    sender: string;
    platform: string;
    timestamp: string;
    roomId: string;
  };
}

/**
 * Vector Search Service for Semantic Message Search
 * 
 * Provides:
 * - Message vectorization using OpenAI embeddings
 * - Semantic search across all messages
 * - Context retrieval for AI summaries
 * - "What did I discuss about X?" queries
 * 
 * Note: For production, integrate with dedicated vector DB (Pinecone/Weaviate/Qdrant)
 * This MVP uses in-memory storage with cosine similarity
 */
export class VectorSearchService {
  private openai: OpenAI | null;
  private configured: boolean = false;
  private vectorStore: Map<string, Embedding> = new Map();
  private dbService: DatabaseService;
  private readonly EMBEDDING_MODEL = 'text-embedding-ada-002';
  private readonly EMBEDDING_DIMENSION = 1536;

  constructor(dbService: DatabaseService) {
    const apiKey = process.env.OPENAI_API_KEY;
    
    if (apiKey && apiKey !== 'your_openai_api_key_here') {
      this.openai = new OpenAI({ apiKey });
      this.configured = true;
    } else {
      console.warn('⚠️  OpenAI API key not configured. Vector search disabled.');
      this.openai = null;
    }
    
    this.dbService = dbService;
  }

  /**
   * Initialize vector store by loading and vectorizing recent messages
   */
  async initialize(messageLimit: number = 1000): Promise<void> {
    if (!this.configured) {
      console.log('Vector search not configured, skipping initialization');
      return;
    }

    console.log('🔄 Initializing vector store...');
    
    try {
      // Load recent messages
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30); // Last 30 days

      const messages = await this.dbService.getMessages({
        startDate,
        endDate,
        limit: messageLimit
      });

      console.log(`📝 Vectorizing ${messages.length} messages...`);

      // Vectorize in batches to avoid rate limits
      const BATCH_SIZE = 100;
      for (let i = 0; i < messages.length; i += BATCH_SIZE) {
        const batch = messages.slice(i, i + BATCH_SIZE);
        await this.vectorizeBatch(batch);
        console.log(`   Progress: ${Math.min(i + BATCH_SIZE, messages.length)}/${messages.length}`);
      }

      console.log(`✅ Vector store initialized with ${this.vectorStore.size} embeddings`);
    } catch (error) {
      console.error('Failed to initialize vector store:', error);
      throw error;
    }
  }

  /**
   * Vectorize a single message and store it
   */
  async vectorizeMessage(message: any): Promise<void> {
    if (!this.configured || !this.openai) {
      return;
    }

    try {
      const embedding = await this.generateEmbedding(message.content);
      
      const vectorData: Embedding = {
        id: message.id,
        vector: embedding,
        metadata: {
          messageId: message.id,
          content: message.content,
          sender: message.sender,
          platform: message.platform,
          timestamp: message.timestamp,
          roomId: message.room_id
        }
      };

      this.vectorStore.set(message.id, vectorData);
    } catch (error) {
      console.error(`Failed to vectorize message ${message.id}:`, error);
    }
  }

  /**
   * Vectorize a batch of messages
   */
  private async vectorizeBatch(messages: any[]): Promise<void> {
    if (!this.configured || !this.openai || messages.length === 0) {
      return;
    }

    try {
      // Extract text content
      const texts = messages.map(m => m.content);

      // Generate embeddings in batch
      const response = await this.openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: texts
      });

      // Store embeddings
      response.data.forEach((embeddingData, index) => {
        const message = messages[index];
        const vectorData: Embedding = {
          id: message.id,
          vector: embeddingData.embedding,
          metadata: {
            messageId: message.id,
            content: message.content,
            sender: message.sender,
            platform: message.platform,
            timestamp: message.timestamp,
            roomId: message.room_id
          }
        };

        this.vectorStore.set(message.id, vectorData);
      });
    } catch (error) {
      console.error('Failed to vectorize batch:', error);
      throw error;
    }
  }

  /**
   * Generate embedding vector for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    if (!this.configured || !this.openai) {
      throw new Error('OpenAI not configured');
    }

    try {
      const response = await this.openai.embeddings.create({
        model: this.EMBEDDING_MODEL,
        input: text
      });

      return response.data[0].embedding;
    } catch (error) {
      console.error('Failed to generate embedding:', error);
      throw error;
    }
  }

  /**
   * Semantic search across all messages
   */
  async search(query: string, limit: number = 10, filters?: {
    platform?: string;
    roomId?: string;
    sender?: string;
    startDate?: Date;
    endDate?: Date;
  }): Promise<VectorSearchResult[]> {
    if (!this.configured || !this.openai) {
      throw new Error('Vector search not configured');
    }

    try {
      // Generate query embedding
      const queryEmbedding = await this.generateEmbedding(query);

      // Calculate similarities
      const results: Array<{ embedding: Embedding; similarity: number }> = [];

      this.vectorStore.forEach((embedding) => {
        // Apply filters
        if (filters) {
          if (filters.platform && embedding.metadata.platform !== filters.platform) return;
          if (filters.roomId && embedding.metadata.roomId !== filters.roomId) return;
          if (filters.sender && embedding.metadata.sender !== filters.sender) return;
          
          const msgDate = new Date(embedding.metadata.timestamp);
          if (filters.startDate && msgDate < filters.startDate) return;
          if (filters.endDate && msgDate > filters.endDate) return;
        }

        const similarity = this.cosineSimilarity(queryEmbedding, embedding.vector);
        results.push({ embedding, similarity });
      });

      // Sort by similarity and take top results
      results.sort((a, b) => b.similarity - a.similarity);
      const topResults = results.slice(0, limit);

      // Format results
      return topResults.map(({ embedding, similarity }) => ({
        messageId: embedding.metadata.messageId,
        content: embedding.metadata.content,
        sender: embedding.metadata.sender,
        platform: embedding.metadata.platform,
        timestamp: new Date(embedding.metadata.timestamp),
        similarity,
        roomId: embedding.metadata.roomId
      }));
    } catch (error) {
      console.error('Search failed:', error);
      throw error;
    }
  }

  /**
   * Find similar messages to a given message
   */
  async findSimilar(messageId: string, limit: number = 5): Promise<VectorSearchResult[]> {
    if (!this.configured) {
      throw new Error('Vector search not configured');
    }

    const targetEmbedding = this.vectorStore.get(messageId);
    if (!targetEmbedding) {
      throw new Error('Message not found in vector store');
    }

    const results: Array<{ embedding: Embedding; similarity: number }> = [];

    this.vectorStore.forEach((embedding, id) => {
      if (id === messageId) return; // Skip the target message itself

      const similarity = this.cosineSimilarity(targetEmbedding.vector, embedding.vector);
      results.push({ embedding, similarity });
    });

    // Sort and take top results
    results.sort((a, b) => b.similarity - a.similarity);
    const topResults = results.slice(0, limit);

    return topResults.map(({ embedding, similarity }) => ({
      messageId: embedding.metadata.messageId,
      content: embedding.metadata.content,
      sender: embedding.metadata.sender,
      platform: embedding.metadata.platform,
      timestamp: new Date(embedding.metadata.timestamp),
      similarity,
      roomId: embedding.metadata.roomId
    }));
  }

  /**
   * Get context messages for AI summaries (retrieve relevant historical context)
   */
  async getContextForSummary(
    keywords: string[],
    limit: number = 20
  ): Promise<VectorSearchResult[]> {
    if (!this.configured) {
      return [];
    }

    try {
      // Combine keywords into a search query
      const query = keywords.join(' ');
      
      // Search for relevant context
      const results = await this.search(query, limit);
      
      return results;
    } catch (error) {
      console.error('Failed to get context:', error);
      return [];
    }
  }

  /**
   * Calculate cosine similarity between two vectors
   */
  private cosineSimilarity(vecA: number[], vecB: number[]): number {
    if (vecA.length !== vecB.length) {
      throw new Error('Vectors must have same length');
    }

    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    for (let i = 0; i < vecA.length; i++) {
      dotProduct += vecA[i] * vecB[i];
      normA += vecA[i] * vecA[i];
      normB += vecB[i] * vecB[i];
    }

    normA = Math.sqrt(normA);
    normB = Math.sqrt(normB);

    if (normA === 0 || normB === 0) {
      return 0;
    }

    return dotProduct / (normA * normB);
  }

  /**
   * Get vector store statistics
   */
  getStats(): {
    totalVectors: number;
    dimension: number;
    configured: boolean;
  } {
    return {
      totalVectors: this.vectorStore.size,
      dimension: this.EMBEDDING_DIMENSION,
      configured: this.configured
    };
  }

  /**
   * Clear vector store (useful for testing)
   */
  clear(): void {
    this.vectorStore.clear();
    console.log('🗑️  Vector store cleared');
  }

  /**
   * Export vector store for persistence (for production, use real vector DB)
   */
  export(): Embedding[] {
    return Array.from(this.vectorStore.values());
  }

  /**
   * Import vector store from persisted data
   */
  import(embeddings: Embedding[]): void {
    this.vectorStore.clear();
    embeddings.forEach(embedding => {
      this.vectorStore.set(embedding.id, embedding);
    });
    console.log(`📥 Imported ${embeddings.length} embeddings into vector store`);
  }
  
  /**
   * Add a message to the vector store for semantic search
   */
  async addMessage(message: {
    platform: string;
    roomId: string;
    sender: string;
    content: string;
    timestamp: Date;
  }): Promise<void> {
    if (!this.configured || !this.openai) {
      return;
    }
    
    try {
      const embedding = await this.generateEmbedding(message.content);
      
      const vectorData: Embedding = {
        id: `${message.platform}_${message.roomId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        vector: embedding,
        metadata: {
          messageId: `${message.platform}_${message.roomId}_${Date.now()}`,
          content: message.content,
          sender: message.sender,
          platform: message.platform,
          timestamp: message.timestamp.toISOString(),
          roomId: message.roomId
        }
      };
      
      this.vectorStore.set(vectorData.id, vectorData);
    } catch (error) {
      console.error(`Failed to vectorize message:`, error);
    }
  }
}
