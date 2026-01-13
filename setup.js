import sqlite3 from 'sqlite3';
import bcrypt from 'bcryptjs';

/**
 * Setup script to create initial test users for the chat application
 * Run this after first installation: node setup.js
 */

const dbPath = process.env.DATABASE_PATH || './data/messages.db';
console.log('🚀 Setting up chat application...');
console.log('📁 Database path:', dbPath);

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Failed to connect to database:', err);
    return;
  }
  console.log('✅ Connected to database successfully');
  
  // Create test users
  const users = [
    { username: 'alice@example.com', password: 'password123' },
    { username: 'bob@example.com', password: 'password123' },
    { username: 'charlie@example.com', password: 'password123' }
  ];
  
  let completed = 0;
  
  users.forEach((user, index) => {
    const userId = `user_${Date.now() + index}`;
    
    bcrypt.hash(user.password, 10, (err, hash) => {
      if (err) {
        console.error(`❌ Error hashing password for ${user.username}:`, err);
        return;
      }
      
      db.run(
        'INSERT OR REPLACE INTO users (id, username, password_hash) VALUES (?, ?, ?)',
        [userId, user.username, hash],
        function(err) {
          if (err) {
            console.error(`❌ Error creating user ${user.username}:`, err);
          } else {
            console.log(`✅ Created user: ${user.username}`);
          }
          
          completed++;
          if (completed === users.length) {
            console.log('\n🎉 Setup completed successfully!');
            console.log('\n📝 Test Users Created:');
            users.forEach(user => {
              console.log(`   👤 ${user.username} / ${user.password}`);
            });
            console.log('\n🌐 Next Steps:');
            console.log('   1. Start the application: npm run dev');
            console.log('   2. Open http://localhost:5173');
            console.log('   3. Login with any of the test users above');
            console.log('   4. Create groups and start chatting!');
            db.close();
          }
        }
      );
    });
  });
});