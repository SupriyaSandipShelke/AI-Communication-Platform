import sqlite3 from 'sqlite3';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';

interface Message {
  platform: string;
  roomId: string;
  sender: string;
  content: string;
  timestamp: Date;
  priority?: 'high' | 'medium' | 'low';
}

export class DatabaseService {
  public db: sqlite3.Database | null = null;

  async initialize() {
    const dbPath = process.env.DATABASE_PATH || './data/messages.db';
    const dbDir = path.dirname(dbPath);

    // Create data directory if it doesn't exist
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true });
    }

    return new Promise<void>((resolve, reject) => {
      this.db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
          console.error('Failed to connect to database:', err);
          reject(err);
          return;
        }

        // Create tables
        this.createTables()
          .then(() => resolve())
          .catch(reject);
      });
    });
  }

  private async createTables() {
    if (!this.db) throw new Error('Database not initialized');

    const run = promisify(this.db.run).bind(this.db);

    await run(`
      CREATE TABLE IF NOT EXISTS messages (
        id TEXT PRIMARY KEY,
        platform TEXT NOT NULL,
        room_id TEXT NOT NULL,
        sender TEXT NOT NULL,
        content TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        edited_at DATETIME,
        priority TEXT DEFAULT 'medium',
        read BOOLEAN DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS summaries (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL UNIQUE,
        summary TEXT NOT NULL,
        key_topics TEXT,
        sentiment TEXT,
        action_items TEXT,
        message_count INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await run(`
      CREATE TABLE IF NOT EXISTS analytics (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date DATE NOT NULL,
        platform TEXT NOT NULL,
        message_count INTEGER DEFAULT 0,
        high_priority_count INTEGER DEFAULT 0,
        response_time_avg INTEGER,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(date, platform)
      )
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_messages_timestamp ON messages(timestamp)
    `);

    await run(`
      CREATE INDEX IF NOT EXISTS idx_messages_priority ON messages(priority)
    `);
    
    // Create users table
    await run(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create scheduled_summaries table
    await run(`
      CREATE TABLE IF NOT EXISTS scheduled_summaries (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        schedule_time TEXT NOT NULL, -- HH:MM format
        timezone TEXT DEFAULT 'UTC',
        enabled BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        last_run DATETIME,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create conversations table
    await run(`
      CREATE TABLE IF NOT EXISTS conversations (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        conversation_id TEXT NOT NULL,
        user_message TEXT NOT NULL,
        ai_response TEXT NOT NULL,
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Create chats table for WhatsApp-like chat list
    await run(`
      CREATE TABLE IF NOT EXISTS chats (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        contact_id TEXT NOT NULL,
        contact_name TEXT,
        last_message TEXT,
        last_message_time DATETIME,
        unread_count INTEGER DEFAULT 0,
        is_pinned BOOLEAN DEFAULT 0,
        is_archived BOOLEAN DEFAULT 0,
        is_group BOOLEAN DEFAULT 0,
        group_name TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Add missing columns to existing chats table (migration)
    try {
      await run(`ALTER TABLE chats ADD COLUMN is_group BOOLEAN DEFAULT 0`);
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message.includes('duplicate column name')) {
        console.warn('Could not add is_group column:', error.message);
      }
    }
    
    try {
      await run(`ALTER TABLE chats ADD COLUMN group_name TEXT`);
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message.includes('duplicate column name')) {
        console.warn('Could not add group_name column:', error.message);
      }
    }
    
    try {
      await run(`ALTER TABLE chats ADD COLUMN contact_name TEXT`);
    } catch (error: any) {
      // Column might already exist, ignore error
      if (!error.message.includes('duplicate column name')) {
        console.warn('Could not add contact_name column:', error.message);
      }
    }
    
    // Create chat_participants table for group chats
    await run(`
      CREATE TABLE IF NOT EXISTS chat_participants (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        role TEXT DEFAULT 'member',
        joined_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats (id)
      )
    `);
    
    // Create message_status table for read receipts, delivery status, etc.
    await run(`
      CREATE TABLE IF NOT EXISTS message_status (
        id TEXT PRIMARY KEY,
        message_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        status TEXT CHECK(status IN ('sent', 'delivered', 'read')) DEFAULT 'sent',
        timestamp DATETIME NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (message_id) REFERENCES messages (id)
      )
    `);
    
    // Create typing_indicators table for typing indicators
    await run(`
      CREATE TABLE IF NOT EXISTS typing_indicators (
        id TEXT PRIMARY KEY,
        chat_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        is_typing BOOLEAN DEFAULT 1,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (chat_id) REFERENCES chats (id)
      )
    `);
    
    // Create calls table for WhatsApp-like calling feature
    await run(`
      CREATE TABLE IF NOT EXISTS calls (
        id TEXT PRIMARY KEY,
        caller_id TEXT NOT NULL,
        callee_id TEXT NOT NULL,
        call_type TEXT CHECK(call_type IN ('audio', 'video')) DEFAULT 'audio',
        status TEXT CHECK(status IN ('initiated', 'ringing', 'connected', 'missed', 'rejected', 'ended')) DEFAULT 'initiated',
        start_time DATETIME,
        end_time DATETIME,
        duration INTEGER, -- in seconds
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (caller_id) REFERENCES users (id),
        FOREIGN KEY (callee_id) REFERENCES users (id)
      )
    `);
  }

  async saveMessage(message: Message & { userId?: string }) {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${message.platform}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO messages (id, platform, room_id, sender, content, timestamp, priority, read)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          id,
          message.platform,
          message.roomId,
          message.sender,
          message.content,
          message.timestamp.toISOString(),
          message.priority || 'medium',
          0 // Default read status
        ],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    return id;
  }

  async getMessages(filters: {
    platform?: string;
    roomId?: string;
    startDate?: Date;
    endDate?: Date;
    priority?: string;
    limit?: number;
  }) {
    if (!this.db) throw new Error('Database not initialized');

    
    let query = 'SELECT id, platform, room_id, sender, content, timestamp, edited_at, priority, read FROM messages WHERE 1=1';
    const params: any[] = [];

    if (filters.platform) {
      query += ' AND platform = ?';
      params.push(filters.platform);
    }

    if (filters.roomId) {
      query += ' AND room_id = ?';
      params.push(filters.roomId);
    }

    if (filters.startDate) {
      query += ' AND timestamp >= ?';
      params.push(filters.startDate.toISOString());
    }

    if (filters.endDate) {
      query += ' AND timestamp <= ?';
      params.push(filters.endDate.toISOString());
    }

    if (filters.priority) {
      query += ' AND priority = ?';
      params.push(filters.priority);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(query, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    return rows;
  }

  async updateMessagePriority(messageId: string, priority: 'high' | 'medium' | 'low') {
    if (!this.db) throw new Error('Database not initialized');

    await new Promise((resolve, reject) => {
      this.db!.run('UPDATE messages SET priority = ? WHERE id = ?', [priority, messageId], (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  }

  async markAsRead(messageId: string) {
    if (!this.db) throw new Error('Database not initialized');

    await new Promise((resolve, reject) => {
      this.db!.run('UPDATE messages SET read = 1 WHERE id = ?', [messageId], (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  }

  async saveDailySummary(date: Date, summary: any) {
    if (!this.db) throw new Error('Database not initialized');

    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO summaries 
         (date, summary, key_topics, sentiment, action_items, message_count)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          date.toISOString().split('T')[0],
          summary.summary,
          JSON.stringify(summary.keyTopics),
          summary.sentiment,
          JSON.stringify(summary.actionItems),
          summary.messageCount || 0
        ],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  async getDailySummary(date: Date) {
    if (!this.db) throw new Error('Database not initialized');

    const row: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM summaries WHERE date = ?',
        [date.toISOString().split('T')[0]],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (!row) return null;

    return {
      date: row.date,
      summary: row.summary,
      keyTopics: JSON.parse(row.key_topics || '[]'),
      sentiment: row.sentiment,
      actionItems: JSON.parse(row.action_items || '[]'),
      messageCount: row.message_count
    };
  }

  async getAnalytics(startDate: Date, endDate: Date) {
    if (!this.db) throw new Error('Database not initialized');

    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT 
          date(timestamp) as date,
          platform,
          COUNT(*) as message_count,
          SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_count
         FROM messages
         WHERE timestamp BETWEEN ? AND ?
         GROUP BY date(timestamp), platform
         ORDER BY date DESC`,
        [startDate.toISOString(), endDate.toISOString()],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    return rows;
  }

  async close() {
    if (this.db) {
      return new Promise<void>((resolve, reject) => {
        this.db!.close((err) => {
          if (err) reject(err);
          else resolve();
        });
      });
    }
  }

  // Scheduled Summaries Methods
  async createScheduledSummary(summary: {
    id: string;
    userId: string;
    scheduleTime: string;
    timezone: string;
    enabled: boolean;
    createdAt: Date;
  }) {
    if (!this.db) throw new Error('Database not initialized');

        
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO scheduled_summaries 
         (id, user_id, schedule_time, timezone, enabled, created_at)
         VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          summary.id,
          summary.userId,
          summary.scheduleTime,
          summary.timezone,
          summary.enabled ? 1 : 0,
          summary.createdAt.toISOString()
        ],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  async updateScheduledSummary(id: string, updates: {
    scheduleTime?: string;
    timezone?: string;
    enabled?: boolean;
    lastRun?: Date;
  }) {
    if (!this.db) throw new Error('Database not initialized');

    
    let query = 'UPDATE scheduled_summaries SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];
    
    if (updates.scheduleTime !== undefined) {
      query += ', schedule_time = ?';
      params.push(updates.scheduleTime);
    }
    if (updates.timezone !== undefined) {
      query += ', timezone = ?';
      params.push(updates.timezone);
    }
    if (updates.enabled !== undefined) {
      query += ', enabled = ?';
      params.push(updates.enabled ? 1 : 0);
    }
    if (updates.lastRun !== undefined) {
      query += ', last_run = ?';
      params.push(updates.lastRun.toISOString());
    }
    
    query += ' WHERE id = ?';
    params.push(id);
    
    await new Promise((resolve, reject) => {
      this.db!.run(query, params, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  }

  async deleteScheduledSummary(id: string) {
    if (!this.db) throw new Error('Database not initialized');

    await new Promise((resolve, reject) => {
      this.db!.run('DELETE FROM scheduled_summaries WHERE id = ?', [id], (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  }

  async getScheduledSummary(userId: string) {
    if (!this.db) throw new Error('Database not initialized');

    const row: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM scheduled_summaries WHERE user_id = ?',
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (!row) return null;

    return {
      id: row.id,
      userId: row.user_id,
      scheduleTime: row.schedule_time,
      timezone: row.timezone,
      enabled: row.enabled === 1,
      createdAt: new Date(row.created_at),
      lastRun: row.last_run ? new Date(row.last_run) : undefined
    };
  }

  async getAllScheduledSummaries() {
    if (!this.db) throw new Error('Database not initialized');

    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all('SELECT * FROM scheduled_summaries WHERE enabled = 1', (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });

    return rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      scheduleTime: row.schedule_time,
      timezone: row.timezone,
      enabled: row.enabled === 1,
      createdAt: new Date(row.created_at),
      lastRun: row.last_run ? new Date(row.last_run) : undefined
    }));
  }
  
  // User Management Methods
  async createUser(userData: {
    id: string;
    username: string;
    passwordHash: string;
  }) {
    if (!this.db) throw new Error('Database not initialized');

        
    try {
      await new Promise((resolve, reject) => {
        this.db!.run(
          `INSERT INTO users (id, username, password_hash)
           VALUES (?, ?, ?)` ,
          [
            userData.id,
            userData.username,
            userData.passwordHash
          ],
          (err) => {
            if (err) reject(err);
            else resolve(undefined);
          }
        );
      });
      
      return {
        id: userData.id,
        username: userData.username,
        createdAt: new Date()
      };
    } catch (error: any) {
      // Check if it's a unique constraint violation
      if (error.message && error.message.includes('UNIQUE constraint failed')) {
        throw new Error('Username already exists');
      }
      throw error;
    }
  }

  async getUserByUsername(username: string) {
    if (!this.db) throw new Error('Database not initialized');

    const row: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM users WHERE username = ?',
        [username],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at)
    };
  }

  async getUserById(id: string) {
    if (!this.db) throw new Error('Database not initialized');

    const row: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM users WHERE id = ?',
        [id],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    if (!row) return null;

    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      createdAt: new Date(row.created_at)
    };
  }

  async updateUser(userId: string, updates: {
    passwordHash?: string;
  }) {
    if (!this.db) throw new Error('Database not initialized');

    
    let query = 'UPDATE users SET updated_at = CURRENT_TIMESTAMP';
    const params: any[] = [];
    
    if (updates.passwordHash !== undefined) {
      query += ', password_hash = ?';
      params.push(updates.passwordHash);
    }
    
    query += ' WHERE id = ?';
    params.push(userId);
    
    await new Promise((resolve, reject) => {
      this.db!.run(query, params, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  }

  async deleteUser(userId: string) {
    if (!this.db) throw new Error('Database not initialized');

    await new Promise((resolve, reject) => {
      this.db!.run('DELETE FROM users WHERE id = ?', [userId], (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  }
  
  // Conversation Methods
  async saveConversation(conversation: {
    userId: string;
    conversationId: string;
    userMessage: string;
    aiResponse: string;
    timestamp: Date;
  }) {
    if (!this.db) throw new Error('Database not initialized');

    const id = `${conversation.userId}_${conversation.conversationId}_${Date.now()}`;

    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO conversations (id, user_id, conversation_id, user_message, ai_response, timestamp)
         VALUES (?, ?, ?, ?, ?, ?)` ,
        [
          id,
          conversation.userId,
          conversation.conversationId,
          conversation.userMessage,
          conversation.aiResponse,
          conversation.timestamp.toISOString()
        ],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });

    return id;
  }

  async getConversationHistory(filters: {
    userId?: string;
    conversationId?: string;
    limit?: number;
  }) {
    if (!this.db) throw new Error('Database not initialized');

    
    let query = 'SELECT * FROM conversations WHERE 1=1';
    const params: any[] = [];

    if (filters.userId) {
      query += ' AND user_id = ?';
      params.push(filters.userId);
    }

    if (filters.conversationId) {
      query += ' AND conversation_id = ?';
      params.push(filters.conversationId);
    }

    query += ' ORDER BY timestamp DESC';

    if (filters.limit) {
      query += ' LIMIT ?';
      params.push(filters.limit);
    }

    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(query, params, (err, result) => {
        if (err) reject(err);
        else resolve(result);
      });
    });
    return rows;
  }
  
  // WhatsApp-like Chat Methods
  
  async createChat(chatData: {
    id: string;
    userId: string;
    contactId: string;
    lastMessage?: string;
  }) {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = chatData.id || `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO chats (id, user_id, contact_id, last_message, last_message_time)
         VALUES (?, ?, ?, ?, ?)` ,
        [
          id,
          chatData.userId,
          chatData.contactId,
          chatData.lastMessage || null,
          chatData.lastMessage ? new Date().toISOString() : null
        ],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
    
    return id;
  }
  
  async getChat(chatId: string, userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const row: any = await new Promise((resolve, reject) => {
      this.db!.get(
        `SELECT * FROM chats 
         WHERE id = ? AND (user_id = ? OR contact_id = ?)` ,
        [chatId, userId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return row;
  }
  
  async getChats(userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT c.*, 
         CASE 
           WHEN c.is_group = 1 THEN c.group_name
           ELSE COALESCE(u.username, c.contact_name, 'Unknown')
         END as name,
         u.username as contact_username,
         CASE 
           WHEN c.is_group = 1 THEN (
             SELECT COUNT(*) FROM chat_participants cp WHERE cp.chat_id = c.id
           )
           ELSE 0
         END as member_count,
         CASE 
           WHEN c.is_group = 1 THEN (
             SELECT GROUP_CONCAT(u2.username) 
             FROM chat_participants cp2 
             JOIN users u2 ON cp2.user_id = u2.id 
             WHERE cp2.chat_id = c.id
           )
           ELSE NULL
         END as member_names
         FROM chats c
         LEFT JOIN users u ON c.contact_id = u.id AND c.is_group = 0
         WHERE c.user_id = ? OR c.contact_id = ? OR (c.is_group = 1 AND c.id IN (
           SELECT cp.chat_id FROM chat_participants cp WHERE cp.user_id = ?
         ))
         ORDER BY c.last_message_time DESC` ,
        [userId, userId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return rows;
  }
  
  async updateChatLastMessage(chatId: string, lastMessage: string, lastMessageTime?: Date) {
    if (!this.db) throw new Error('Database not initialized');
    
    const time = lastMessageTime || new Date();
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `UPDATE chats 
         SET last_message = ?, last_message_time = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ?` ,
        [lastMessage, time.toISOString(), chatId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  async markChatMessagesAsRead(chatId: string, userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    // First, update message status in message_status table
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO message_status (message_id, user_id, status, timestamp)
         SELECT id, ?, 'read', ?
         FROM messages
         WHERE room_id = ?` ,
        [userId, new Date().toISOString(), chatId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
    
    // Reset unread count for the chat
    await new Promise((resolve, reject) => {
      this.db!.run(
        `UPDATE chats SET unread_count = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?` ,
        [chatId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  async incrementUnreadCount(chatId: string, userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `UPDATE chats SET unread_count = unread_count + 1, updated_at = CURRENT_TIMESTAMP WHERE id = ? AND user_id = ?` ,
        [chatId, userId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  async setMessageStatus(messageId: string, userId: string, status: 'sent' | 'delivered' | 'read') {
    if (!this.db) throw new Error('Database not initialized');
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO message_status (message_id, user_id, status, timestamp)
         VALUES (?, ?, ?, ?)` ,
        [messageId, userId, status, new Date().toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  async getMessageStatus(messageId: string, userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const row: any = await new Promise((resolve, reject) => {
      this.db!.get(
        `SELECT * FROM message_status WHERE message_id = ? AND user_id = ?` ,
        [messageId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return row;
  }
  
  async setTypingStatus(chatId: string, userId: string, isTyping: boolean) {
    if (!this.db) throw new Error('Database not initialized');
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO typing_indicators (id, chat_id, user_id, is_typing, updated_at)
         VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)` ,
        [`${chatId}_${userId}`, chatId, userId, isTyping ? 1 : 0],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  async getTypingStatus(chatId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT * FROM typing_indicators WHERE chat_id = ? AND is_typing = 1` ,
        [chatId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return rows;
  }
  
  async removeTypingStatus(chatId: string, userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `DELETE FROM typing_indicators WHERE chat_id = ? AND user_id = ?` ,
        [chatId, userId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  // WhatsApp-like Call Methods
  
  async createCall(callData: {
    id: string;
    callerId: string;
    calleeId: string;
    callType: 'audio' | 'video';
    status?: 'initiated' | 'ringing' | 'connected' | 'missed' | 'rejected' | 'ended';
  }) {
    if (!this.db) throw new Error('Database not initialized');
    
    const id = callData.id || `call_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const status = callData.status || 'initiated';
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO calls (id, caller_id, callee_id, call_type, status)
         VALUES (?, ?, ?, ?, ?)` ,
        [id, callData.callerId, callData.calleeId, callData.callType, status],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
    
    return id;
  }
  
  async updateCallStatus(callId: string, status: 'initiated' | 'ringing' | 'connected' | 'missed' | 'rejected' | 'ended', startTime?: Date, endTime?: Date, duration?: number) {
    if (!this.db) throw new Error('Database not initialized');
    
    let query = `UPDATE calls SET status = ?`;
    const params: any[] = [status];
    
    if (startTime) {
      query += `, start_time = ?`;
      params.push(startTime.toISOString());
    }
    
    if (endTime) {
      query += `, end_time = ?`;
      params.push(endTime.toISOString());
    }
    
    if (duration !== undefined) {
      query += `, duration = ?`;
      params.push(duration);
    }
    
    query += ` WHERE id = ?`;
    params.push(callId);
    
    await new Promise((resolve, reject) => {
      this.db!.run(query, params, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
  }
  
  async getCall(callId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const row: any = await new Promise((resolve, reject) => {
      this.db!.get(
        `SELECT * FROM calls WHERE id = ?` ,
        [callId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return row;
  }
  
  async getUserCalls(userId: string, limit: number = 50) {
    if (!this.db) throw new Error('Database not initialized');
    
    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT * FROM calls 
         WHERE caller_id = ? OR callee_id = ?
         ORDER BY created_at DESC LIMIT ?` ,
        [userId, userId, limit],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return rows;
  }
  
  async getRecentCalls(userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT c.*, u1.username as caller_username, u2.username as callee_username
         FROM calls c
         JOIN users u1 ON c.caller_id = u1.id
         JOIN users u2 ON c.callee_id = u2.id
         WHERE c.caller_id = ? OR c.callee_id = ?
         ORDER BY c.created_at DESC LIMIT 20` ,
        [userId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return rows;
  }
  
  // Enhanced Call Methods
  async getUserCalls(userId: string, limit = 50, offset = 0) {
    if (!this.db) throw new Error('Database not initialized');
    
    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT c.*, 
                u1.username as caller_name,
                u2.username as callee_name
         FROM calls c
         LEFT JOIN users u1 ON c.caller_id = u1.id
         LEFT JOIN users u2 ON c.callee_id = u2.id
         WHERE c.caller_id = ? OR c.callee_id = ?
         ORDER BY c.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, userId, limit, offset],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return rows;
  }
  
  // Message Enhancement Methods
  async getMessage(messageId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const row: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT * FROM messages WHERE id = ?',
        [messageId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return row;
  }
  
  async editMessage(messageId: string, newContent: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        'UPDATE messages SET content = ?, edited_at = ? WHERE id = ?',
        [newContent, new Date().toISOString(), messageId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  async deleteMessage(messageId: string, deleteForEveryone = false) {
    if (!this.db) throw new Error('Database not initialized');
    
    if (deleteForEveryone) {
      // Actually delete the message
      await new Promise((resolve, reject) => {
        this.db!.run('DELETE FROM messages WHERE id = ?', [messageId], (err) => {
          if (err) reject(err);
          else resolve(undefined);
        });
      });
    } else {
      // Mark as deleted for user only
      await new Promise((resolve, reject) => {
        this.db!.run(
          'UPDATE messages SET content = "[Message deleted]", edited_at = ? WHERE id = ?',
          [new Date().toISOString(), messageId],
          (err) => {
            if (err) reject(err);
            else resolve(undefined);
          }
        );
      });
    }
  }
  
  async addMessageReaction(messageId: string, userId: string, emoji: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    // Create message_reactions table if it doesn't exist
    await new Promise((resolve, reject) => {
      this.db!.run(`
        CREATE TABLE IF NOT EXISTS message_reactions (
          id TEXT PRIMARY KEY,
          message_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          emoji TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES messages (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(message_id, user_id, emoji)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
    
    const reactionId = `reaction_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO message_reactions (id, message_id, user_id, emoji)
         VALUES (?, ?, ?, ?)`,
        [reactionId, messageId, userId, emoji],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  async toggleMessageStar(messageId: string, userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    // Create starred_messages table if it doesn't exist
    await new Promise((resolve, reject) => {
      this.db!.run(`
        CREATE TABLE IF NOT EXISTS starred_messages (
          id TEXT PRIMARY KEY,
          message_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (message_id) REFERENCES messages (id),
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(message_id, user_id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
    
    // Check if already starred
    const existing: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT id FROM starred_messages WHERE message_id = ? AND user_id = ?',
        [messageId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    if (existing) {
      // Unstar
      await new Promise((resolve, reject) => {
        this.db!.run(
          'DELETE FROM starred_messages WHERE message_id = ? AND user_id = ?',
          [messageId, userId],
          (err) => {
            if (err) reject(err);
            else resolve(undefined);
          }
        );
      });
      return false;
    } else {
      // Star
      const starId = `star_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await new Promise((resolve, reject) => {
        this.db!.run(
          'INSERT INTO starred_messages (id, message_id, user_id) VALUES (?, ?, ?)',
          [starId, messageId, userId],
          (err) => {
            if (err) reject(err);
            else resolve(undefined);
          }
        );
      });
      return true;
    }
  }
  
  async getStarredMessages(userId: string, limit = 50, offset = 0) {
    if (!this.db) throw new Error('Database not initialized');
    
    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT m.*, sm.created_at as starred_at
         FROM messages m
         INNER JOIN starred_messages sm ON m.id = sm.message_id
         WHERE sm.user_id = ?
         ORDER BY sm.created_at DESC
         LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return rows;
  }
  
  // WhatsApp Group Methods
  async createWhatsAppGroup(groupData: {
    id: string;
    name: string;
    description?: string;
    creatorId: string;
    isGroup: boolean;
    participants: string[];
    createdAt: Date;
  }) {
    if (!this.db) throw new Error('Database not initialized');
    
    console.log('DatabaseService.createWhatsAppGroup called with:', groupData);
    
    // Create the group chat
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO chats (id, user_id, contact_id, contact_name, group_name, last_message, last_message_time, is_group, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          groupData.id,
          groupData.creatorId,
          'group', // contact_id for groups
          groupData.name, // contact_name
          groupData.name, // group_name
          groupData.description || 'Group created',
          groupData.createdAt.toISOString(),
          1, // is_group = true
          groupData.createdAt.toISOString()
        ],
        (err) => {
          if (err) {
            console.error('Error creating group chat:', err);
            reject(err);
          } else {
            console.log('Group chat created successfully');
            resolve(undefined);
          }
        }
      );
    });
    
    // Add all participants
    console.log('Adding participants:', groupData.participants);
    for (const participantId of groupData.participants) {
      const participantData = {
        id: `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        chat_id: groupData.id,
        user_id: participantId,
        role: participantId === groupData.creatorId ? 'admin' : 'member',
        joined_at: groupData.createdAt.toISOString()
      };
      
      console.log('Adding participant:', participantData);
      
      await new Promise((resolve, reject) => {
        this.db!.run(
          `INSERT INTO chat_participants (id, chat_id, user_id, role, joined_at)
           VALUES (?, ?, ?, ?, ?)`,
          [participantData.id, participantData.chat_id, participantData.user_id, participantData.role, participantData.joined_at],
          (err) => {
            if (err) {
              console.error('Error adding participant:', err);
              reject(err);
            } else {
              console.log('Participant added successfully:', participantData.user_id);
              resolve(undefined);
            }
          }
        );
      });
    }
    
    console.log('Group creation completed successfully');
  }
  
  async getUserWhatsAppGroups(userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT c.*, 
                COUNT(cp.user_id) as member_count,
                GROUP_CONCAT(u.username) as member_names
         FROM chats c
         INNER JOIN chat_participants cp ON c.id = cp.chat_id
         LEFT JOIN users u ON cp.user_id = u.id
         WHERE cp.user_id = ? AND c.is_group = 1
         GROUP BY c.id
         ORDER BY c.updated_at DESC`,
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return rows;
  }
  
  async addWhatsAppGroupMember(groupId: string, adminUserId: string, memberId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    // Check if user is admin
    const adminCheck: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?',
        [groupId, adminUserId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    if (!adminCheck || adminCheck.role !== 'admin') {
      throw new Error('Only admins can add members');
    }
    
    // Add member
    const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO chat_participants (id, chat_id, user_id, role, joined_at)
         VALUES (?, ?, ?, 'member', ?)`,
        [participantId, groupId, memberId, new Date().toISOString()],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  async removeWhatsAppGroupMember(groupId: string, adminUserId: string, memberId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    // Check if user is admin
    const adminCheck: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?',
        [groupId, adminUserId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    if (!adminCheck || adminCheck.role !== 'admin') {
      throw new Error('Only admins can remove members');
    }
    
    // Remove member
    await new Promise((resolve, reject) => {
      this.db!.run(
        'DELETE FROM chat_participants WHERE chat_id = ? AND user_id = ?',
        [groupId, memberId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
  
  // User Management Methods
  async getAllUsers() {
    if (!this.db) throw new Error('Database not initialized');
    
    const rows: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        'SELECT id, username, created_at FROM users ORDER BY username',
        [],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return rows;
  }
  
  async createInvitation(invitationData: {
    id: string;
    email: string;
    invitedBy: string;
    userId: string;
    status: string;
  }) {
    if (!this.db) throw new Error('Database not initialized');
    
    // Create invitations table if it doesn't exist
    await new Promise((resolve, reject) => {
      this.db!.run(`
        CREATE TABLE IF NOT EXISTS invitations (
          id TEXT PRIMARY KEY,
          email TEXT NOT NULL,
          invited_by TEXT NOT NULL,
          user_id TEXT NOT NULL,
          status TEXT DEFAULT 'pending',
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (invited_by) REFERENCES users (id),
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT INTO invitations (id, email, invited_by, user_id, status)
         VALUES (?, ?, ?, ?, ?)`,
        [invitationData.id, invitationData.email, invitationData.invitedBy, invitationData.userId, invitationData.status],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  // Additional methods for new features
  async isGroupAdmin(groupId: string, userId: string): Promise<boolean> {
    if (!this.db) throw new Error('Database not initialized');
    
    const result: any = await new Promise((resolve, reject) => {
      this.db!.get(
        'SELECT role FROM chat_participants WHERE chat_id = ? AND user_id = ?',
        [groupId, userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    // If no result found, check if user is the creator of the group
    if (!result) {
      const groupResult: any = await new Promise((resolve, reject) => {
        this.db!.get(
          'SELECT user_id FROM chats WHERE id = ? AND is_group = 1',
          [groupId],
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
      
      return groupResult?.user_id === userId;
    }
    
    return result?.role === 'admin';
  }

  async updateGroupProfile(groupId: string, updateData: any) {
    if (!this.db) throw new Error('Database not initialized');
    
    // First, ensure all columns exist
    try {
      await new Promise((resolve, reject) => {
        this.db!.run(`ALTER TABLE chats ADD COLUMN description TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
    } catch (error) {
      // Column might already exist
    }
    
    try {
      await new Promise((resolve, reject) => {
        this.db!.run(`ALTER TABLE chats ADD COLUMN profile_picture TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
    } catch (error) {
      // Column might already exist
    }
    
    try {
      await new Promise((resolve, reject) => {
        this.db!.run(`ALTER TABLE chats ADD COLUMN background_color TEXT DEFAULT '#3b82f6'`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
    } catch (error) {
      // Column might already exist
    }
    
    try {
      await new Promise((resolve, reject) => {
        this.db!.run(`ALTER TABLE chats ADD COLUMN background_image TEXT`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
    } catch (error) {
      // Column might already exist
    }
    
    const fields = [];
    const values = [];
    
    if (updateData.name) {
      fields.push('group_name = ?', 'contact_name = ?');
      values.push(updateData.name, updateData.name);
    }
    if (updateData.description) {
      fields.push('description = ?');
      values.push(updateData.description);
    }
    if (updateData.profilePicture) {
      fields.push('profile_picture = ?');
      values.push(updateData.profilePicture);
    }
    if (updateData.backgroundColor) {
      fields.push('background_color = ?');
      values.push(updateData.backgroundColor);
    }
    if (updateData.backgroundImage) {
      fields.push('background_image = ?');
      values.push(updateData.backgroundImage);
    }
    
    if (fields.length === 0) {
      throw new Error('No fields to update');
    }
    
    values.push(groupId);
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `UPDATE chats SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        values,
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  async setChatMuteStatus(chatId: string, userId: string, muted: boolean) {
    if (!this.db) throw new Error('Database not initialized');
    
    // First, ensure chat_settings table exists
    await new Promise((resolve, reject) => {
      this.db!.run(`
        CREATE TABLE IF NOT EXISTS chat_settings (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          chat_id TEXT NOT NULL,
          user_id TEXT NOT NULL,
          muted BOOLEAN DEFAULT 0,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(chat_id, user_id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO chat_settings (chat_id, user_id, muted, updated_at)
         VALUES (?, ?, ?, CURRENT_TIMESTAMP)`,
        [chatId, userId, muted ? 1 : 0],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  async setDisappearingMessages(chatId: string, disappearingTime: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    // Add column if it doesn't exist
    try {
      await new Promise((resolve, reject) => {
        this.db!.run(`ALTER TABLE chats ADD COLUMN disappearing_messages TEXT DEFAULT 'off'`, (err) => {
          if (err && !err.message.includes('duplicate column name')) {
            reject(err);
          } else {
            resolve(undefined);
          }
        });
      });
    } catch (error) {
      // Column might already exist
    }
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `UPDATE chats SET disappearing_messages = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [disappearingTime, chatId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  async clearChatMessages(chatId: string, userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `DELETE FROM messages WHERE room_id = ? AND user_id = ?`,
        [chatId, userId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  async getChatMessages(chatId: string, userId: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    const messages: any[] = await new Promise((resolve, reject) => {
      this.db!.all(
        `SELECT * FROM messages WHERE room_id = ? ORDER BY timestamp ASC`,
        [chatId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });
    
    return messages;
  }

  async blockUser(currentUserId: string, userIdToBlock: string) {
    if (!this.db) throw new Error('Database not initialized');
    
    // Create blocked_users table if it doesn't exist
    await new Promise((resolve, reject) => {
      this.db!.run(`
        CREATE TABLE IF NOT EXISTS blocked_users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          blocker_id TEXT NOT NULL,
          blocked_id TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          UNIQUE(blocker_id, blocked_id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });
    
    await new Promise((resolve, reject) => {
      this.db!.run(
        `INSERT OR REPLACE INTO blocked_users (blocker_id, blocked_id) VALUES (?, ?)`,
        [currentUserId, userIdToBlock],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }
}