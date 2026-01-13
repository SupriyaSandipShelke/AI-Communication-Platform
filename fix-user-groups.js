import sqlite3 from 'sqlite3';

const dbPath = './data/messages.db';
const currentUserId = '9ac5f8bd-8195-432b-9e71-3a79fa7e3362'; // supriyashelke2003@gmail.com

console.log('🔧 Adding current user to existing groups...');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('❌ Database connection failed:', err);
    return;
  }
  
  console.log('✅ Connected to database');
  
  // Get all existing groups
  db.all('SELECT * FROM chats WHERE is_group = 1', (err, groups) => {
    if (err) {
      console.error('❌ Error getting groups:', err);
      return;
    }
    
    console.log(`📋 Found ${groups.length} groups`);
    
    let completed = 0;
    
    groups.forEach(group => {
      // Check if user is already a participant
      db.get(
        'SELECT * FROM chat_participants WHERE chat_id = ? AND user_id = ?',
        [group.id, currentUserId],
        (err, existing) => {
          if (err) {
            console.error('❌ Error checking participant:', err);
            return;
          }
          
          if (existing) {
            console.log(`ℹ️  User already in group: ${group.group_name}`);
            completed++;
            if (completed === groups.length) {
              console.log('🎉 All groups processed!');
              db.close();
            }
          } else {
            // Add user to group
            const participantId = `participant_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            
            db.run(
              'INSERT INTO chat_participants (id, chat_id, user_id, role, joined_at) VALUES (?, ?, ?, ?, ?)',
              [participantId, group.id, currentUserId, 'member', new Date().toISOString()],
              function(err) {
                if (err) {
                  console.error(`❌ Error adding user to ${group.group_name}:`, err);
                } else {
                  console.log(`✅ Added user to group: ${group.group_name}`);
                }
                
                completed++;
                if (completed === groups.length) {
                  console.log('\n🎉 User added to all groups successfully!');
                  console.log('🔄 Refresh your browser to see the groups');
                  db.close();
                }
              }
            );
          }
        }
      );
    });
    
    if (groups.length === 0) {
      console.log('ℹ️  No groups found to add user to');
      db.close();
    }
  });
});