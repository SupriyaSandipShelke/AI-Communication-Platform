interface ActivityEvent {
  id: string;
  type: 'message_sent' | 'group_created' | 'user_added' | 'call_made' | 'file_shared' | 'status_updated' | 'group_joined' | 'settings_changed';
  platform: string;
  description: string;
  timestamp: Date;
  metadata?: any;
}

interface DailySummary {
  date: string;
  totalActivities: number;
  summary: string;
  keyTopics: string[];
  actionItems: string[];
  platformBreakdown: { [platform: string]: number };
  activityTypes: { [type: string]: number };
}

class ActivityTracker {
  private activities: ActivityEvent[] = [];
  private readonly STORAGE_KEY = 'user_activities';
  private readonly SUMMARY_KEY = 'daily_summaries';

  constructor() {
    this.loadActivities();
  }

  private loadActivities() {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        this.activities = JSON.parse(stored).map((activity: any) => ({
          ...activity,
          timestamp: new Date(activity.timestamp)
        }));
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      this.activities = [];
    }
  }

  private saveActivities() {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.activities));
    } catch (error) {
      console.error('Failed to save activities:', error);
    }
  }

  trackActivity(type: ActivityEvent['type'], platform: string, description: string, metadata?: any) {
    const activity: ActivityEvent = {
      id: `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      platform,
      description,
      timestamp: new Date(),
      metadata
    };

    this.activities.push(activity);
    this.saveActivities();

    // Generate summary for today if we have enough activities
    this.generateTodaysSummary();
  }

  getTodaysActivities(): ActivityEvent[] {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

    return this.activities.filter(activity => 
      activity.timestamp >= startOfDay && activity.timestamp < endOfDay
    );
  }

  generateTodaysSummary(): DailySummary {
    const todaysActivities = this.getTodaysActivities();
    const today = new Date().toISOString().split('T')[0];

    if (todaysActivities.length === 0) {
      return {
        date: today,
        totalActivities: 0,
        summary: "No activities recorded today. Start by sending messages, creating groups, or updating your status to see your daily summary here.",
        keyTopics: ["Getting Started"],
        actionItems: ["Send your first message", "Create a group", "Update your status"],
        platformBreakdown: {},
        activityTypes: {}
      };
    }

    // Count activities by platform
    const platformBreakdown: { [platform: string]: number } = {};
    const activityTypes: { [type: string]: number } = {};
    
    todaysActivities.forEach(activity => {
      platformBreakdown[activity.platform] = (platformBreakdown[activity.platform] || 0) + 1;
      activityTypes[activity.type] = (activityTypes[activity.type] || 0) + 1;
    });

    // Generate summary text
    const totalActivities = todaysActivities.length;
    const mostUsedPlatform = Object.keys(platformBreakdown).reduce((a, b) => 
      platformBreakdown[a] > platformBreakdown[b] ? a : b
    );
    const mostCommonActivity = Object.keys(activityTypes).reduce((a, b) => 
      activityTypes[a] > activityTypes[b] ? a : b
    );

    let summary = `Today you performed ${totalActivities} activities across your communication platforms. `;
    
    if (mostUsedPlatform) {
      summary += `${mostUsedPlatform.charAt(0).toUpperCase() + mostUsedPlatform.slice(1)} was your most active platform with ${platformBreakdown[mostUsedPlatform]} activities. `;
    }

    if (activityTypes.message_sent > 0) {
      summary += `You sent ${activityTypes.message_sent} messages. `;
    }

    if (activityTypes.group_created > 0) {
      summary += `You created ${activityTypes.group_created} new groups. `;
    }

    if (activityTypes.call_made > 0) {
      summary += `You made ${activityTypes.call_made} calls. `;
    }

    // Generate key topics
    const keyTopics: string[] = [];
    if (activityTypes.message_sent > 5) keyTopics.push("Active Messaging");
    if (activityTypes.group_created > 0) keyTopics.push("Group Management");
    if (activityTypes.call_made > 0) keyTopics.push("Voice/Video Calls");
    if (activityTypes.file_shared > 0) keyTopics.push("File Sharing");
    if (activityTypes.status_updated > 0) keyTopics.push("Status Updates");
    if (Object.keys(platformBreakdown).length > 1) keyTopics.push("Multi-Platform Communication");

    // Generate action items
    const actionItems: string[] = [];
    if (activityTypes.message_sent > 10) {
      actionItems.push("Consider organizing frequent conversations into groups");
    }
    if (Object.keys(platformBreakdown).length === 1) {
      actionItems.push("Try exploring other platforms for broader communication");
    }
    if (!activityTypes.status_updated) {
      actionItems.push("Share a status update to keep contacts informed");
    }
    if (activityTypes.group_created > 0 && !activityTypes.user_added) {
      actionItems.push("Add members to your newly created groups");
    }

    const dailySummary: DailySummary = {
      date: today,
      totalActivities,
      summary: summary.trim(),
      keyTopics: keyTopics.length > 0 ? keyTopics : ["Communication Activity"],
      actionItems: actionItems.length > 0 ? actionItems : ["Keep up the great communication!"],
      platformBreakdown,
      activityTypes
    };

    // Save summary
    this.saveDailySummary(dailySummary);
    
    return dailySummary;
  }

  private saveDailySummary(summary: DailySummary) {
    try {
      const stored = localStorage.getItem(this.SUMMARY_KEY);
      const summaries = stored ? JSON.parse(stored) : {};
      summaries[summary.date] = summary;
      localStorage.setItem(this.SUMMARY_KEY, JSON.stringify(summaries));
    } catch (error) {
      console.error('Failed to save daily summary:', error);
    }
  }

  getDailySummary(date?: string): DailySummary | null {
    try {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const stored = localStorage.getItem(this.SUMMARY_KEY);
      if (stored) {
        const summaries = JSON.parse(stored);
        return summaries[targetDate] || null;
      }
    } catch (error) {
      console.error('Failed to get daily summary:', error);
    }
    return null;
  }

  // Helper methods for easy tracking
  trackMessageSent(platform: string, recipient: string, messageType: 'text' | 'file' | 'voice' = 'text') {
    this.trackActivity('message_sent', platform, `Sent ${messageType} message to ${recipient}`, { recipient, messageType });
  }

  trackGroupCreated(platform: string, groupName: string, memberCount: number) {
    this.trackActivity('group_created', platform, `Created group "${groupName}" with ${memberCount} members`, { groupName, memberCount });
  }

  trackUserAdded(platform: string, userName: string, groupName?: string) {
    const description = groupName 
      ? `Added ${userName} to group "${groupName}"`
      : `Added ${userName} as contact`;
    this.trackActivity('user_added', platform, description, { userName, groupName });
  }

  trackCallMade(platform: string, recipient: string, callType: 'voice' | 'video') {
    this.trackActivity('call_made', platform, `Made ${callType} call to ${recipient}`, { recipient, callType });
  }

  trackFileShared(platform: string, fileName: string, recipient: string) {
    this.trackActivity('file_shared', platform, `Shared file "${fileName}" with ${recipient}`, { fileName, recipient });
  }

  trackStatusUpdated(platform: string, statusType: 'text' | 'image' | 'video') {
    this.trackActivity('status_updated', platform, `Updated ${statusType} status`, { statusType });
  }

  trackGroupJoined(platform: string, groupName: string) {
    this.trackActivity('group_joined', platform, `Joined group "${groupName}"`, { groupName });
  }

  trackSettingsChanged(platform: string, settingType: string) {
    this.trackActivity('settings_changed', platform, `Changed ${settingType} settings`, { settingType });
  }

  // Get activity statistics
  getActivityStats(days: number = 7) {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const recentActivities = this.activities.filter(activity => activity.timestamp >= cutoffDate);
    
    const stats = {
      totalActivities: recentActivities.length,
      platformBreakdown: {} as { [platform: string]: number },
      activityTypes: {} as { [type: string]: number },
      dailyBreakdown: {} as { [date: string]: number }
    };

    recentActivities.forEach(activity => {
      const date = activity.timestamp.toISOString().split('T')[0];
      stats.platformBreakdown[activity.platform] = (stats.platformBreakdown[activity.platform] || 0) + 1;
      stats.activityTypes[activity.type] = (stats.activityTypes[activity.type] || 0) + 1;
      stats.dailyBreakdown[date] = (stats.dailyBreakdown[date] || 0) + 1;
    });

    return stats;
  }
}

// Create singleton instance
export const activityTracker = new ActivityTracker();
export default ActivityTracker;