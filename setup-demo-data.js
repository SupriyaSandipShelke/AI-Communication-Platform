import { DatabaseService } from './src/server/services/DatabaseService.ts';

async function setupDemoData() {
  console.log('🚀 Setting up demo data...');
  
  const dbService = new DatabaseService();
  await dbService.initialize();
  
  // Create demo users
  const users = [
    { id: 'user1', username: 'john_doe', email: 'john@example.com', password: 'hashed_password' },
    { id: 'user2', username: 'jane_smith', email: 'jane@example.com', password: 'hashed_password' },
    { id: 'user3', username: 'mike_wilson', email: 'mike@example.com', password: 'hashed_password' },
    { id: 'user4', username: 'sarah_jones', email: 'sarah@example.com', password: 'hashed_password' }
  ];
  
  for (const user of users) {
    try {
      await dbService.createUser(user);
      console.log(`✅ Created user: ${user.username}`);
    } catch (error) {
      console.log(`⚠️  User ${user.username} already exists`);
    }
  }
  
  // Create demo chats/rooms
  const chats = [
    { id: 'chat1', name: 'Project Alpha Team', type: 'group', participants: ['user1', 'user2', 'user3'] },
    { id: 'chat2', name: 'Marketing Discussion', type: 'group', participants: ['user1', 'user2', 'user4'] },
    { id: 'chat3', name: 'Direct: John & Jane', type: 'direct', participants: ['user1', 'user2'] },
    { id: 'chat4', name: 'Support Tickets', type: 'group', participants: ['user1', 'user3', 'user4'] }
  ];
  
  for (const chat of chats) {
    try {
      await dbService.createChat(chat);
      console.log(`✅ Created chat: ${chat.name}`);
    } catch (error) {
      console.log(`⚠️  Chat ${chat.name} already exists`);
    }
  }
  
  // Create demo messages with various priorities
  const messages = [
    {
      platform: 'websocket',
      roomId: 'chat1',
      sender: 'user2',
      content: 'URGENT: Production server is down! Need immediate attention.',
      timestamp: new Date(Date.now() - 1000 * 60 * 30), // 30 minutes ago
      userId: 'user2',
      priority: 95
    },
    {
      platform: 'websocket',
      roomId: 'chat2',
      sender: 'user4',
      content: 'The client meeting has been moved to tomorrow at 2 PM. Please confirm your availability.',
      timestamp: new Date(Date.now() - 1000 * 60 * 60), // 1 hour ago
      userId: 'user4',
      priority: 85
    },
    {
      platform: 'websocket',
      roomId: 'chat4',
      sender: 'user3',
      content: 'Customer reported a critical bug in the payment system. Ticket #12345',
      timestamp: new Date(Date.now() - 1000 * 60 * 45), // 45 minutes ago
      userId: 'user3',
      priority: 90
    },
    {
      platform: 'websocket',
      roomId: 'chat1',
      sender: 'user3',
      content: 'Code review needed for the new authentication module before deployment.',
      timestamp: new Date(Date.now() - 1000 * 60 * 120), // 2 hours ago
      userId: 'user3',
      priority: 75
    },
    {
      platform: 'websocket',
      roomId: 'chat2',
      sender: 'user2',
      content: 'Marketing campaign performance report is ready for review.',
      timestamp: new Date(Date.now() - 1000 * 60 * 180), // 3 hours ago
      userId: 'user2',
      priority: 60
    },
    {
      platform: 'websocket',
      roomId: 'chat3',
      sender: 'user2',
      content: 'Hey John, are we still on for lunch today?',
      timestamp: new Date(Date.now() - 1000 * 60 * 240), // 4 hours ago
      userId: 'user2',
      priority: 30
    },
    {
      platform: 'websocket',
      roomId: 'chat1',
      sender: 'user2',
      content: 'Team standup meeting in 15 minutes in conference room A.',
      timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
      userId: 'user2',
      priority: 70
    },
    {
      platform: 'websocket',
      roomId: 'chat4',
      sender: 'user4',
      content: 'New feature request from client: dark mode for mobile app.',
      timestamp: new Date(Date.now() - 1000 * 60 * 300), // 5 hours ago
      userId: 'user4',
      priority: 50
    }
  ];
  
  for (const message of messages) {
    try {
      const messageId = await dbService.saveMessage(message);
      
      // Set priority in database
      if (message.priority) {
        await dbService.updateMessagePriority(messageId, message.priority);
      }
      
      console.log(`✅ Created message: ${message.content.substring(0, 50)}...`);
    } catch (error) {
      console.log(`⚠️  Error creating message: ${error.message}`);
    }
  }
  
  // Create some memory vault entries
  const memories = [
    {
      userId: 'user1',
      content: 'John prefers morning meetings and works best with detailed documentation',
      context: 'work preferences',
      importance: 0.8,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7) // 1 week ago
    },
    {
      userId: 'user1',
      content: 'Project Alpha deadline is next Friday, critical for Q1 goals',
      context: 'project timeline',
      importance: 0.9,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3) // 3 days ago
    },
    {
      userId: 'user1',
      content: 'Client mentioned they need mobile app features prioritized',
      context: 'client requirements',
      importance: 0.7,
      timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2) // 2 days ago
    }
  ];
  
  for (const memory of memories) {
    try {
      await dbService.saveMemory(memory);
      console.log(`✅ Created memory: ${memory.content.substring(0, 50)}...`);
    } catch (error) {
      console.log(`⚠️  Error creating memory: ${error.message}`);
    }
  }
  
  console.log('🎉 Demo data setup complete!');
  console.log('');
  console.log('Demo users created:');
  console.log('- john_doe (user1)');
  console.log('- jane_smith (user2)');
  console.log('- mike_wilson (user3)');
  console.log('- sarah_jones (user4)');
  console.log('');
  console.log('You can now sign in with any username and the application will work with demo data!');
  
  process.exit(0);
}

setupDemoData().catch(console.error);