export class DemoDataService {
  static generatePlatformChats(platform: string) {
    const baseTime = Date.now();
    
    switch (platform) {
      case 'telegram':
        return {
          success: true,
          chats: [
            {
              id: 'tg_bot_chat',
              name: 'Telegram Bot',
              last_message: 'Welcome to Telegram! 🚀 Your bot is ready to receive messages.',
              last_message_time: new Date(baseTime - 300000).toISOString(),
              unread_count: 1,
              is_group: false,
              platform: 'telegram'
            },
            {
              id: 'tg_dev_group',
              name: 'Developers Chat',
              last_message: 'Anyone working on the new API integration?',
              last_message_time: new Date(baseTime - 600000).toISOString(),
              unread_count: 3,
              is_group: true,
              member_count: 8,
              platform: 'telegram'
            },
            {
              id: 'tg_announcements',
              name: 'Announcements',
              last_message: 'New Telegram features are now available! Check them out.',
              last_message_time: new Date(baseTime - 1200000).toISOString(),
              unread_count: 0,
              is_group: true,
              member_count: 156,
              platform: 'telegram'
            }
          ]
        };

      case 'instagram':
        return {
          success: true,
          chats: [
            {
              id: 'ig_business_inquiry',
              name: 'Sarah Johnson',
              last_message: 'Hi! I love your recent posts! 📸 Can we collaborate?',
              last_message_time: new Date(baseTime - 180000).toISOString(),
              unread_count: 2,
              is_group: false,
              platform: 'instagram'
            },
            {
              id: 'ig_customer_support',
              name: 'Mike Chen',
              last_message: 'Thanks for the quick response! Your service is amazing 💕',
              last_message_time: new Date(baseTime - 450000).toISOString(),
              unread_count: 0,
              is_group: false,
              platform: 'instagram'
            },
            {
              id: 'ig_influencer_collab',
              name: 'Emma Wilson',
              last_message: 'The campaign results look fantastic! 📈',
              last_message_time: new Date(baseTime - 900000).toISOString(),
              unread_count: 1,
              is_group: false,
              platform: 'instagram'
            }
          ]
        };

      case 'slack':
        return {
          success: true,
          chats: [
            {
              id: 'slack_general',
              name: '#general',
              last_message: 'Good morning team! Ready for the sprint planning? 💪',
              last_message_time: new Date(baseTime - 120000).toISOString(),
              unread_count: 5,
              is_group: true,
              member_count: 24,
              platform: 'slack'
            },
            {
              id: 'slack_development',
              name: '#development',
              last_message: 'PR #247 is ready for review. New features implemented! 🎉',
              last_message_time: new Date(baseTime - 240000).toISOString(),
              unread_count: 2,
              is_group: true,
              member_count: 12,
              platform: 'slack'
            },
            {
              id: 'slack_design',
              name: '#design',
              last_message: 'New mockups are in Figma. Feedback welcome! 🎨',
              last_message_time: new Date(baseTime - 360000).toISOString(),
              unread_count: 0,
              is_group: true,
              member_count: 8,
              platform: 'slack'
            },
            {
              id: 'slack_dm_john',
              name: 'John Doe',
              last_message: 'Can we sync up about the project timeline?',
              last_message_time: new Date(baseTime - 480000).toISOString(),
              unread_count: 1,
              is_group: false,
              platform: 'slack'
            }
          ]
        };

      case 'matrix':
        return {
          success: true,
          chats: [
            {
              id: '!matrix_community:matrix.org',
              name: 'Matrix Community',
              last_message: 'Decentralized messaging is the future! 🔐 End-to-end encryption for all.',
              last_message_time: new Date(baseTime - 300000).toISOString(),
              unread_count: 3,
              is_group: true,
              member_count: 47,
              platform: 'matrix'
            },
            {
              id: '!privacy_advocates:matrix.org',
              name: 'Privacy Advocates',
              last_message: 'New security features in the latest Matrix update are impressive!',
              last_message_time: new Date(baseTime - 600000).toISOString(),
              unread_count: 1,
              is_group: true,
              member_count: 89,
              platform: 'matrix'
            },
            {
              id: '@alice:matrix.org',
              name: 'Alice Smith',
              last_message: 'The encrypted message was received successfully ✅',
              last_message_time: new Date(baseTime - 720000).toISOString(),
              unread_count: 0,
              is_group: false,
              platform: 'matrix'
            }
          ]
        };

      default:
        return { success: false, chats: [] };
    }
  }

  static generatePlatformMessages(platform: string, roomId: string) {
    const baseTime = Date.now();
    
    const commonMessages = {
      telegram: [
        {
          id: 'tg_msg_1',
          content: 'Hello! Welcome to Telegram! 🚀',
          sender: 'telegram_bot',
          senderName: 'Telegram Bot',
          timestamp: new Date(baseTime - 600000).toISOString(),
          status: 'read',
          type: 'text'
        },
        {
          id: 'tg_msg_2',
          content: 'You can send messages here and they will be processed by the Telegram adapter.',
          sender: 'telegram_bot',
          senderName: 'Telegram Bot',
          timestamp: new Date(baseTime - 480000).toISOString(),
          status: 'read',
          type: 'text'
        },
        {
          id: 'tg_msg_3',
          content: 'Try sending a message to see how it works! ✈️',
          sender: 'telegram_bot',
          senderName: 'Telegram Bot',
          timestamp: new Date(baseTime - 300000).toISOString(),
          status: 'read',
          type: 'text'
        }
      ],
      instagram: [
        {
          id: 'ig_msg_1',
          content: 'Hey! Thanks for following us on Instagram! 📸',
          sender: 'instagram_user',
          senderName: 'Instagram User',
          timestamp: new Date(baseTime - 720000).toISOString(),
          status: 'read',
          type: 'text'
        },
        {
          id: 'ig_msg_2',
          content: 'Love your recent posts! The photography is amazing 💕',
          sender: 'instagram_user',
          senderName: 'Instagram User',
          timestamp: new Date(baseTime - 540000).toISOString(),
          status: 'read',
          type: 'text'
        },
        {
          id: 'ig_msg_3',
          content: 'Would love to collaborate on some content! 🤝',
          sender: 'instagram_user',
          senderName: 'Instagram User',
          timestamp: new Date(baseTime - 180000).toISOString(),
          status: 'delivered',
          type: 'text'
        }
      ],
      slack: [
        {
          id: 'slack_msg_1',
          content: 'Good morning team! Ready for another productive day? 💪',
          sender: 'john_doe',
          senderName: 'John Doe',
          timestamp: new Date(baseTime - 900000).toISOString(),
          status: 'read',
          type: 'text'
        },
        {
          id: 'slack_msg_2',
          content: 'The new feature is ready for testing! 🎉 Please check it out.',
          sender: 'jane_smith',
          senderName: 'Jane Smith',
          timestamp: new Date(baseTime - 600000).toISOString(),
          status: 'read',
          type: 'text'
        },
        {
          id: 'slack_msg_3',
          content: 'Great work everyone! The sprint is going well 👏',
          sender: 'mike_wilson',
          senderName: 'Mike Wilson',
          timestamp: new Date(baseTime - 240000).toISOString(),
          status: 'read',
          type: 'text'
        }
      ],
      matrix: [
        {
          id: 'matrix_msg_1',
          content: 'Welcome to the decentralized future of messaging! 🔐',
          sender: '@user:matrix.org',
          senderName: 'Matrix User',
          timestamp: new Date(baseTime - 800000).toISOString(),
          status: 'read',
          type: 'text'
        },
        {
          id: 'matrix_msg_2',
          content: 'End-to-end encryption is enabled for this conversation ✅',
          sender: '@user:matrix.org',
          senderName: 'Matrix User',
          timestamp: new Date(baseTime - 450000).toISOString(),
          status: 'read',
          type: 'text'
        },
        {
          id: 'matrix_msg_3',
          content: 'Your privacy is protected with Matrix protocol 🛡️',
          sender: '@admin:matrix.org',
          senderName: 'Matrix Admin',
          timestamp: new Date(baseTime - 90000).toISOString(),
          status: 'delivered',
          type: 'text'
        }
      ]
    };

    return {
      success: true,
      messages: commonMessages[platform as keyof typeof commonMessages] || []
    };
  }

  static getPlatformWelcomeMessage(platform: string) {
    const messages = {
      telegram: 'Welcome to Telegram! Your messages are fast and secure. ✈️',
      instagram: 'Welcome to Instagram messaging! Share your visual stories. 📸',
      slack: 'Welcome to Slack! Collaborate with your team efficiently. 💬',
      matrix: 'Welcome to Matrix! Enjoy decentralized, encrypted messaging. 🔐',
      whatsapp: 'Welcome to WhatsApp! Connect with friends and family. 📱'
    };

    return messages[platform as keyof typeof messages] || 'Welcome to the platform!';
  }
}