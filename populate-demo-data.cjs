/**
 * Demo Data Population Script
 * Populates the database with realistic demo data for all features
 */

const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, 'data', 'messages.db');

// Ensure data directory exists
const dataDir = path.dirname(dbPath);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new sqlite3.Database(dbPath);

console.log('🚀 Starting demo data population...\n');

// Helper function to run queries
function runQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.run(query, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
}

function getQuery(query, params = []) {
  return new Promise((resolve, reject) => {
    db.get(query, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

async function populateData() {
  try {
    // Clear existing demo data (keep structure)
    console.log('🗑️  Clearing existing demo data...');
    await runQuery('DELETE FROM messages WHERE sender LIKE "%Demo%"');
    
    // Generate messages over the last 30 days
    console.log('💬 Creating messages...');
    const platforms = ['WhatsApp', 'Matrix', 'Slack', 'Direct', 'WebSocket'];
    const priorities = ['high', 'medium', 'low'];
    const senders = ['Alice Demo', 'Bob Demo', 'Charlie Demo', 'David Demo', 'Emma Demo'];
    
    const messageTemplates = [
      { content: 'Hey, can we schedule a meeting for tomorrow?', priority: 'high' },
      { content: 'Thanks for the update!', priority: 'low' },
      { content: 'I have a question about the project', priority: 'medium' },
      { content: 'Great work on the presentation!', priority: 'low' },
      { content: 'URGENT: Server is down!', priority: 'high' },
      { content: 'Can you review this document?', priority: 'medium' },
      { content: 'Happy Friday everyone!', priority: 'low' },
      { content: 'Meeting in 10 minutes', priority: 'high' },
      { content: 'Check out this article', priority: 'low' },
      { content: 'Need your approval on this', priority: 'medium' },
      { content: 'Lunch plans?', priority: 'low' },
      { content: 'Project deadline is approaching', priority: 'high' },
      { content: 'Good morning team!', priority: 'low' },
      { content: 'Can someone help with this bug?', priority: 'medium' },
      { content: 'Congratulations on the launch!', priority: 'low' }
    ];
    
    const now = Date.now();
    const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);
    
    const insertMessage = `
      INSERT INTO messages (id, platform, room_id, sender, content, timestamp, priority, read)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    for (let i = 0; i < 200; i++) {
      const template = messageTemplates[Math.floor(Math.random() * messageTemplates.length)];
      const sender = senders[Math.floor(Math.random() * senders.length)];
      const platform = platforms[Math.floor(Math.random() * platforms.length)];
      const timestamp = new Date(thirtyDaysAgo + Math.random() * (now - thirtyDaysAgo)).toISOString();
      const isRead = Math.random() > 0.3; // 70% read
      const id = `demo_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 9)}`;
      const roomId = `room_${Math.floor(Math.random() * 10)}`;
      
      await runQuery(insertMessage, [
        id,
        platform,
        roomId,
        sender,
        template.content,
        timestamp,
        template.priority,
        isRead ? 1 : 0
      ]);
      
      if ((i + 1) % 50 === 0) {
        console.log(`   Created ${i + 1} messages...`);
      }
    }
    
    // Get statistics
    console.log('\n📊 Calculating statistics...');
    const totalMessages = await getQuery('SELECT COUNT(*) as count FROM messages');
    const highPriority = await getQuery('SELECT COUNT(*) as count FROM messages WHERE priority = "high"');
    const mediumPriority = await getQuery('SELECT COUNT(*) as count FROM messages WHERE priority = "medium"');
    const lowPriority = await getQuery('SELECT COUNT(*) as count FROM messages WHERE priority = "low"');
    const unreadMessages = await getQuery('SELECT COUNT(*) as count FROM messages WHERE read = 0');
    
    console.log('\n✅ Demo data population complete!\n');
    console.log('📊 Statistics:');
    console.log(`   Total Messages: ${totalMessages.count}`);
    console.log(`   Unread Messages: ${unreadMessages.count}`);
    console.log(`   High Priority: ${highPriority.count}`);
    console.log(`   Medium Priority: ${mediumPriority.count}`);
    console.log(`   Low Priority: ${lowPriority.count}`);
    
    console.log('\n🎉 Demo data loaded successfully!');
    console.log('🌐 Refresh your browser to see the data');
    console.log('📊 Navigate to: http://localhost:5173/analytics');
    
  } catch (error) {
    console.error('❌ Error populating data:', error);
  } finally {
    db.close();
  }
}

populateData();
