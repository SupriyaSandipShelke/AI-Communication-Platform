import { DatabaseService } from './DatabaseService.js';

interface NotificationData {
  userId: string;
  title: string;
  body: string;
  type: 'message' | 'call' | 'status' | 'group' | 'system';
  data?: any;
  icon?: string;
  badge?: string;
  sound?: string;
  priority?: 'high' | 'normal' | 'low';
}

interface PushSubscription {
  userId: string;
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class NotificationService {
  private dbService: DatabaseService;
  private vapidKeys: { publicKey: string; privateKey: string } | null = null;

  constructor(dbService: DatabaseService) {
    this.dbService = dbService;
    this.initializeVapidKeys();
  }

  private initializeVapidKeys() {
    // In production, these should be stored securely
    this.vapidKeys = {
      publicKey: process.env.VAPID_PUBLIC_KEY || 'demo-public-key',
      privateKey: process.env.VAPID_PRIVATE_KEY || 'demo-private-key'
    };
  }

  async sendNotification(notification: NotificationData) {
    try {
      // Get user's push subscriptions
      const subscriptions = await this.getUserPushSubscriptions(notification.userId);
      
      if (subscriptions.length === 0) {
        console.log(`No push subscriptions found for user ${notification.userId}`);
        return;
      }

      // Send to all user's devices
      const promises = subscriptions.map(subscription => 
        this.sendPushNotification(subscription, notification)
      );

      await Promise.allSettled(promises);

      // Store notification in database for history
      await this.storeNotification(notification);

    } catch (error) {
      console.error('Failed to send notification:', error);
    }
  }

  private async sendPushNotification(subscription: PushSubscription, notification: NotificationData) {
    try {
      // In a real implementation, you would use web-push library here
      console.log(`Sending push notification to ${subscription.userId}:`, {
        title: notification.title,
        body: notification.body,
        type: notification.type
      });

      // Simulate push notification
      // const webpush = require('web-push');
      // webpush.setVapidDetails(
      //   'mailto:your-email@example.com',
      //   this.vapidKeys.publicKey,
      //   this.vapidKeys.privateKey
      // );
      // 
      // await webpush.sendNotification(subscription, JSON.stringify({
      //   title: notification.title,
      //   body: notification.body,
      //   icon: notification.icon || '/icon-192x192.png',
      //   badge: notification.badge || '/badge-72x72.png',
      //   data: notification.data,
      //   tag: notification.type,
      //   requireInteraction: notification.priority === 'high'
      // }));

    } catch (error) {
      console.error('Failed to send push notification:', error);
      // Remove invalid subscription
      await this.removePushSubscription(subscription.userId, subscription.endpoint);
    }
  }

  async subscribeToPush(userId: string, subscription: any) {
    try {
      await this.storePushSubscription({
        userId,
        endpoint: subscription.endpoint,
        keys: subscription.keys
      });
      return true;
    } catch (error) {
      console.error('Failed to store push subscription:', error);
      return false;
    }
  }

  async unsubscribeFromPush(userId: string, endpoint: string) {
    try {
      await this.removePushSubscription(userId, endpoint);
      return true;
    } catch (error) {
      console.error('Failed to remove push subscription:', error);
      return false;
    }
  }

  // Notification helpers for different types
  async notifyNewMessage(senderId: string, recipientId: string, message: string, chatName?: string) {
    await this.sendNotification({
      userId: recipientId,
      title: chatName || 'New Message',
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      type: 'message',
      data: { senderId, chatName },
      priority: 'normal'
    });
  }

  async notifyIncomingCall(callerId: string, calleeId: string, callerName: string, callType: 'audio' | 'video') {
    await this.sendNotification({
      userId: calleeId,
      title: `Incoming ${callType} call`,
      body: `${callerName} is calling you`,
      type: 'call',
      data: { callerId, callType },
      priority: 'high',
      sound: 'ringtone.mp3'
    });
  }

  async notifyStatusUpdate(userId: string, contactId: string, contactName: string) {
    await this.sendNotification({
      userId,
      title: 'Status Update',
      body: `${contactName} posted a new status`,
      type: 'status',
      data: { contactId },
      priority: 'low'
    });
  }

  async notifyGroupMessage(senderId: string, groupId: string, groupName: string, message: string, memberIds: string[]) {
    const promises = memberIds
      .filter(memberId => memberId !== senderId)
      .map(memberId => this.sendNotification({
        userId: memberId,
        title: groupName,
        body: message.length > 100 ? message.substring(0, 100) + '...' : message,
        type: 'group',
        data: { senderId, groupId },
        priority: 'normal'
      }));

    await Promise.allSettled(promises);
  }

  // Database operations
  private async storePushSubscription(subscription: PushSubscription) {
    // Create push_subscriptions table if it doesn't exist
    await new Promise((resolve, reject) => {
      this.dbService['db']!.run(`
        CREATE TABLE IF NOT EXISTS push_subscriptions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          endpoint TEXT NOT NULL,
          p256dh_key TEXT NOT NULL,
          auth_key TEXT NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id),
          UNIQUE(user_id, endpoint)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });

    const subscriptionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await new Promise((resolve, reject) => {
      this.dbService['db']!.run(
        `INSERT OR REPLACE INTO push_subscriptions 
         (id, user_id, endpoint, p256dh_key, auth_key)
         VALUES (?, ?, ?, ?, ?)`,
        [subscriptionId, subscription.userId, subscription.endpoint, subscription.keys.p256dh, subscription.keys.auth],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  private async getUserPushSubscriptions(userId: string): Promise<PushSubscription[]> {
    const rows: any[] = await new Promise((resolve, reject) => {
      this.dbService['db']!.all(
        'SELECT * FROM push_subscriptions WHERE user_id = ?',
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        }
      );
    });

    return rows.map(row => ({
      userId: row.user_id,
      endpoint: row.endpoint,
      keys: {
        p256dh: row.p256dh_key,
        auth: row.auth_key
      }
    }));
  }

  private async removePushSubscription(userId: string, endpoint: string) {
    await new Promise((resolve, reject) => {
      this.dbService['db']!.run(
        'DELETE FROM push_subscriptions WHERE user_id = ? AND endpoint = ?',
        [userId, endpoint],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  private async storeNotification(notification: NotificationData) {
    // Create notifications table if it doesn't exist
    await new Promise((resolve, reject) => {
      this.dbService['db']!.run(`
        CREATE TABLE IF NOT EXISTS notifications (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          title TEXT NOT NULL,
          body TEXT NOT NULL,
          type TEXT NOT NULL,
          data TEXT,
          is_read BOOLEAN DEFAULT 0,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users (id)
        )
      `, (err) => {
        if (err) reject(err);
        else resolve(undefined);
      });
    });

    const notificationId = `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await new Promise((resolve, reject) => {
      this.dbService['db']!.run(
        `INSERT INTO notifications (id, user_id, title, body, type, data)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          notificationId,
          notification.userId,
          notification.title,
          notification.body,
          notification.type,
          JSON.stringify(notification.data || {})
        ],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    const rows: any[] = await new Promise((resolve, reject) => {
      this.dbService['db']!.all(
        `SELECT * FROM notifications 
         WHERE user_id = ? 
         ORDER BY created_at DESC 
         LIMIT ? OFFSET ?`,
        [userId, limit, offset],
        (err, result) => {
          if (err) reject(err);
          else resolve(result || []);
        }
      );
    });

    return rows.map(row => ({
      id: row.id,
      title: row.title,
      body: row.body,
      type: row.type,
      data: JSON.parse(row.data || '{}'),
      isRead: row.is_read === 1,
      createdAt: new Date(row.created_at)
    }));
  }

  async markNotificationAsRead(notificationId: string, userId: string) {
    await new Promise((resolve, reject) => {
      this.dbService['db']!.run(
        'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?',
        [notificationId, userId],
        (err) => {
          if (err) reject(err);
          else resolve(undefined);
        }
      );
    });
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const row: any = await new Promise((resolve, reject) => {
      this.dbService['db']!.get(
        'SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0',
        [userId],
        (err, result) => {
          if (err) reject(err);
          else resolve(result);
        }
      );
    });

    return row?.count || 0;
  }
}