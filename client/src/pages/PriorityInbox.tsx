import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { MessageSquare, AlertTriangle, Clock, CheckCircle, Star, ChevronRight, ArrowLeft } from 'lucide-react';
import '../styles/chatMessage.css';

interface PriorityMessage {
  id: string;
  sender: string;
  senderName?: string;
  content: string;
  timestamp: Date;
  priority: number; // 0-100 scale
  roomId: string;
  roomName: string;
  read: boolean;
  platform?: string;
  reasons?: string[];
  suggestedAction?: string;
}

interface PriorityFilters {
  minPriority: number;
  maxPriority: number;
  unreadOnly: boolean;
  daysBack: number;
  platforms: string[];
  senders: string[];
  sortBy: 'priority' | 'timestamp' | 'sender';
  sortOrder: 'asc' | 'desc';
}

interface PrioritySettings {
  autoRefresh: boolean;
  refreshInterval: number; // seconds
  notifications: boolean;
  soundAlerts: boolean;
  vipContacts: string[];
  customKeywords: string[];
  priorityThresholds: {
    critical: number;
    high: number;
    medium: number;
    low: number;
  };
}

export default function PriorityInbox() {
  const [inbox, setInbox] = useState<PriorityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  const [filters, setFilters] = useState<PriorityFilters>({
    minPriority: 50,
    maxPriority: 100,
    unreadOnly: false,
    daysBack: 7,
    platforms: [],
    senders: [],
    sortBy: 'priority',
    sortOrder: 'desc'
  });

  const [settings, setSettings] = useState<PrioritySettings>({
    autoRefresh: true,
    refreshInterval: 30,
    notifications: true,
    soundAlerts: false,
    vipContacts: [],
    customKeywords: ['urgent', 'asap', 'deadline', 'critical'],
    priorityThresholds: {
      critical: 80,
      high: 60,
      medium: 40,
      low: 20
    }
  });

  useEffect(() => {
    loadPriorityInbox();
    
    // Auto-refresh if enabled
    let interval: NodeJS.Timeout;
    if (settings.autoRefresh) {
      interval = setInterval(() => {
        loadPriorityInbox(true); // Silent refresh
      }, settings.refreshInterval * 1000);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [filters, settings.autoRefresh, settings.refreshInterval]);

  const loadPriorityInbox = async (silent = false) => {
    try {
      if (!silent) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }
      
      // Fetch priority inbox from API
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`/api/priority/inbox?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match our interface
        const transformedInbox = data.inbox.map((item: any) => ({
          id: item.messageId || item.id || `msg-${Math.random()}`,
          sender: item.sender || 'Unknown',
          senderName: item.senderName || item.sender || 'Unknown User',
          content: item.content || item.message || 'No content',
          timestamp: new Date(item.timestamp || item.createdAt),
          priority: item.priorityScore || item.priority || item.score || 50,
          roomId: item.roomId || item.chatId || 'unknown',
          roomName: item.roomName || item.chatName || 'General',
          read: item.isRead || item.read || false,
          platform: item.platform || 'websocket',
          reasons: item.reasons || [],
          suggestedAction: item.suggestedAction || 'Review message'
        }));
        
        setInbox(transformedInbox);
        
        // Show notification for new high-priority messages if enabled
        if (silent && settings.notifications) {
          const newCriticalMessages = transformedInbox.filter(
            (msg: PriorityMessage) => msg.priority >= settings.priorityThresholds.critical && !msg.read
          );
          
          if (newCriticalMessages.length > 0) {
            showNotification(`${newCriticalMessages.length} new critical message(s)!`);
          }
        }
      }
    } catch (error) {
      console.error('Failed to load priority inbox:', error);
      // Fallback to demo data if API fails
      loadDemoData();
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadDemoData = () => {
    // Demo data for when API is not available
    const demoMessages: PriorityMessage[] = [
      {
        id: 'demo-1',
        sender: 'jane_smith',
        senderName: 'Jane Smith',
        content: 'URGENT: Production server is down! Need immediate attention.',
        timestamp: new Date(Date.now() - 1000 * 60 * 30),
        priority: 95,
        roomId: 'chat1',
        roomName: 'Project Alpha Team',
        read: false,
        platform: 'websocket',
        reasons: ['Contains urgency keywords', 'Critical system issue'],
        suggestedAction: 'Respond immediately - system critical'
      },
      {
        id: 'demo-2',
        sender: 'mike_wilson',
        senderName: 'Mike Wilson',
        content: 'Customer reported a critical bug in the payment system. Ticket #12345',
        timestamp: new Date(Date.now() - 1000 * 60 * 45),
        priority: 90,
        roomId: 'chat4',
        roomName: 'Support Tickets',
        read: false,
        platform: 'websocket',
        reasons: ['Critical system component', 'Customer impact'],
        suggestedAction: 'Investigate immediately'
      },
      {
        id: 'demo-3',
        sender: 'sarah_jones',
        senderName: 'Sarah Jones',
        content: 'The client meeting has been moved to tomorrow at 2 PM. Please confirm your availability.',
        timestamp: new Date(Date.now() - 1000 * 60 * 60),
        priority: 85,
        roomId: 'chat2',
        roomName: 'Marketing Discussion',
        read: false,
        platform: 'websocket',
        reasons: ['Meeting scheduling', 'Client communication'],
        suggestedAction: 'Confirm availability today'
      },
      {
        id: 'demo-4',
        sender: 'mike_wilson',
        senderName: 'Mike Wilson',
        content: 'Code review needed for the new authentication module before deployment.',
        timestamp: new Date(Date.now() - 1000 * 60 * 120),
        priority: 75,
        roomId: 'chat1',
        roomName: 'Project Alpha Team',
        read: true,
        platform: 'websocket',
        reasons: ['Deployment dependency', 'Code review required'],
        suggestedAction: 'Schedule code review'
      },
      {
        id: 'demo-5',
        sender: 'jane_smith',
        senderName: 'Jane Smith',
        content: 'Marketing campaign performance report is ready for review.',
        timestamp: new Date(Date.now() - 1000 * 60 * 180),
        priority: 60,
        roomId: 'chat2',
        roomName: 'Marketing Discussion',
        read: false,
        platform: 'websocket',
        reasons: ['Report available', 'Performance review'],
        suggestedAction: 'Review when convenient'
      }
    ];
    
    setInbox(demoMessages);
  };

  const showNotification = (message: string) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification('Priority Inbox', {
        body: message,
        icon: '/favicon.ico'
      });
    }
    
    if (settings.soundAlerts) {
      // Play notification sound
      const audio = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBSuBzvLZiTYIG2m98OScTgwOUarm7blmGgU7k9n1unEiBC13yO/eizEIHWq+8+OWT');
      audio.play().catch(() => {}); // Ignore errors
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= settings.priorityThresholds.critical) return '#ef4444'; // red
    if (priority >= settings.priorityThresholds.high) return '#f59e0b'; // amber
    if (priority >= settings.priorityThresholds.medium) return '#10b981'; // green
    return '#6b7280'; // gray
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= settings.priorityThresholds.critical) return 'Critical';
    if (priority >= settings.priorityThresholds.high) return 'High';
    if (priority >= settings.priorityThresholds.medium) return 'Medium';
    return 'Low';
  };

  const markAsRead = async (messageId: string) => {
    // In a real implementation, this would call the API
    setInbox(prev => prev.map(msg => 
      msg.id === messageId ? { ...msg, read: true } : msg
    ));
  };

  return (
    <Layout>
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '32px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Link to="/dashboard" style={{ 
                display: 'flex', 
                alignItems: 'center', 
                color: 'var(--text-secondary)',
                textDecoration: 'none'
              }}>
                <ArrowLeft size={20} />
              </Link>
              <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                Priority Inbox
              </h1>
              {refreshing && (
                <div style={{ 
                  fontSize: '12px', 
                  color: 'var(--text-secondary)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}>
                  <div style={{ 
                    width: '12px', 
                    height: '12px', 
                    border: '2px solid var(--border-medium)',
                    borderTop: '2px solid var(--bubble-sent)',
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite'
                  }} />
                  Refreshing...
                </div>
              )}
            </div>
            
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                onClick={() => loadPriorityInbox()}
                disabled={loading}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  background: 'var(--bg-primary)',
                  color: 'var(--text-primary)',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔄 Refresh
              </button>
              
              <button
                onClick={() => setShowFilters(!showFilters)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  background: showFilters ? 'var(--bubble-sent)' : 'var(--bg-primary)',
                  color: showFilters ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                🔍 Filters
              </button>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                style={{
                  padding: '8px 16px',
                  border: '1px solid var(--border-medium)',
                  borderRadius: '8px',
                  background: showSettings ? 'var(--bubble-sent)' : 'var(--bg-primary)',
                  color: showSettings ? 'white' : 'var(--text-primary)',
                  cursor: 'pointer',
                  fontSize: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                ⚙️ Settings
              </button>
            </div>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '16px' }}>
            Messages that need your attention, ranked by importance
          </p>
        </div>

        {/* Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '16px',
          marginBottom: '32px'
        }}>
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(239, 68, 68, 0.1)',
                color: '#ef4444'
              }}>
                <AlertTriangle size={20} />
              </div>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Critical</h3>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {inbox.filter(m => m.priority >= settings.priorityThresholds.critical).length}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(245, 158, 11, 0.1)',
                color: '#f59e0b'
              }}>
                <Clock size={20} />
              </div>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>High Priority</h3>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {inbox.filter(m => m.priority >= settings.priorityThresholds.high && m.priority < settings.priorityThresholds.critical).length}
            </div>
          </div>

          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: 'var(--shadow-sm)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{
                padding: '8px',
                borderRadius: '8px',
                background: 'rgba(16, 185, 129, 0.1)',
                color: '#10b981'
              }}>
                <Star size={20} />
              </div>
              <h3 style={{ fontSize: '14px', color: 'var(--text-secondary)', margin: 0 }}>Total Priority</h3>
            </div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)' }}>
              {inbox.length}
            </div>
          </div>
        </div>

        {/* Advanced Filters */}
        {showFilters && (
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid var(--border-medium)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
              🔍 Advanced Filters
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
              gap: '16px',
              marginBottom: '16px'
            }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Priority Range
                </label>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={filters.minPriority}
                    onChange={(e) => setFilters({...filters, minPriority: Number(e.target.value)})}
                    style={{ flex: 1 }}
                  />
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '60px' }}>
                    {filters.minPriority}+ priority
                  </span>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Time Range
                </label>
                <select
                  value={filters.daysBack}
                  onChange={(e) => setFilters({...filters, daysBack: Number(e.target.value)})}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  <option value={1}>Last 24 hours</option>
                  <option value={3}>Last 3 days</option>
                  <option value={7}>Last week</option>
                  <option value={14}>Last 2 weeks</option>
                  <option value={30}>Last month</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                  Sort By
                </label>
                <select
                  value={`${filters.sortBy}-${filters.sortOrder}`}
                  onChange={(e) => {
                    const [sortBy, sortOrder] = e.target.value.split('-');
                    setFilters({...filters, sortBy: sortBy as any, sortOrder: sortOrder as any});
                  }}
                  style={{
                    width: '100%',
                    padding: '8px 12px',
                    border: '1px solid var(--border-medium)',
                    borderRadius: '8px',
                    background: 'var(--bg-primary)',
                    color: 'var(--text-primary)',
                    fontSize: '14px'
                  }}
                >
                  <option value="priority-desc">Priority (High to Low)</option>
                  <option value="priority-asc">Priority (Low to High)</option>
                  <option value="timestamp-desc">Newest First</option>
                  <option value="timestamp-asc">Oldest First</option>
                  <option value="sender-asc">Sender (A-Z)</option>
                  <option value="sender-desc">Sender (Z-A)</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={filters.unreadOnly}
                  onChange={(e) => setFilters({...filters, unreadOnly: e.target.checked})}
                />
                Show unread only
              </label>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>Platform:</span>
                {['websocket', 'matrix', 'email'].map(platform => (
                  <label key={platform} style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px' }}>
                    <input
                      type="checkbox"
                      checked={filters.platforms.includes(platform)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setFilters({...filters, platforms: [...filters.platforms, platform]});
                        } else {
                          setFilters({...filters, platforms: filters.platforms.filter(p => p !== platform)});
                        }
                      }}
                    />
                    {platform}
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Settings Panel */}
        {showSettings && (
          <div style={{
            background: 'var(--bg-secondary)',
            borderRadius: '12px',
            padding: '20px',
            marginBottom: '24px',
            border: '1px solid var(--border-medium)'
          }}>
            <h3 style={{ margin: '0 0 16px 0', fontSize: '16px', color: 'var(--text-primary)' }}>
              ⚙️ Priority Inbox Settings
            </h3>
            
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px'
            }}>
              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Auto-Refresh
                </h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={settings.autoRefresh}
                    onChange={(e) => setSettings({...settings, autoRefresh: e.target.checked})}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Enable auto-refresh
                  </span>
                </label>
                {settings.autoRefresh && (
                  <div>
                    <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
                      Refresh every {settings.refreshInterval} seconds
                    </label>
                    <input
                      type="range"
                      min="10"
                      max="300"
                      step="10"
                      value={settings.refreshInterval}
                      onChange={(e) => setSettings({...settings, refreshInterval: Number(e.target.value)})}
                      style={{ width: '100%' }}
                    />
                  </div>
                )}
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Notifications
                </h4>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <input
                    type="checkbox"
                    checked={settings.notifications}
                    onChange={(e) => setSettings({...settings, notifications: e.target.checked})}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Browser notifications
                  </span>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <input
                    type="checkbox"
                    checked={settings.soundAlerts}
                    onChange={(e) => setSettings({...settings, soundAlerts: e.target.checked})}
                  />
                  <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                    Sound alerts
                  </span>
                </label>
              </div>

              <div>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', color: 'var(--text-primary)' }}>
                  Priority Thresholds
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {Object.entries(settings.priorityThresholds).map(([level, threshold]) => (
                    <div key={level} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '60px', textTransform: 'capitalize' }}>
                        {level}:
                      </span>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={threshold}
                        onChange={(e) => setSettings({
                          ...settings,
                          priorityThresholds: {
                            ...settings.priorityThresholds,
                            [level]: Number(e.target.value)
                          }
                        })}
                        style={{ flex: 1 }}
                      />
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)', minWidth: '30px' }}>
                        {threshold}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Priority Messages */}
        {loading ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            color: 'var(--text-secondary)' 
          }}>
            Loading priority messages...
          </div>
        ) : inbox.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '48px', 
            color: 'var(--text-secondary)'
          }}>
            <MessageSquare size={48} style={{ margin: '0 auto 16px', opacity: 0.5 }} />
            <h3 style={{ fontSize: '18px', marginBottom: '8px' }}>No priority messages</h3>
            <p>Your priority inbox is clean!</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {inbox
              .filter(msg => {
                // Priority filter
                if (msg.priority < filters.minPriority || msg.priority > filters.maxPriority) return false;
                
                // Read status filter
                if (filters.unreadOnly && msg.read) return false;
                
                // Time filter
                const daysDiff = (Date.now() - msg.timestamp.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > filters.daysBack) return false;
                
                // Platform filter
                if (filters.platforms.length > 0 && !filters.platforms.includes(msg.platform || 'websocket')) return false;
                
                // Sender filter
                if (filters.senders.length > 0 && !filters.senders.includes(msg.sender)) return false;
                
                return true;
              })
              .sort((a, b) => {
                switch (filters.sortBy) {
                  case 'priority':
                    return filters.sortOrder === 'desc' ? b.priority - a.priority : a.priority - b.priority;
                  case 'timestamp':
                    return filters.sortOrder === 'desc' 
                      ? b.timestamp.getTime() - a.timestamp.getTime()
                      : a.timestamp.getTime() - b.timestamp.getTime();
                  case 'sender':
                    return filters.sortOrder === 'desc' 
                      ? b.sender.localeCompare(a.sender)
                      : a.sender.localeCompare(b.sender);
                  default:
                    return b.priority - a.priority;
                }
              })
              .map((message) => (
                <div
                  key={message.id}
                  style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '16px',
                    boxShadow: 'var(--shadow-sm)',
                    border: message.read ? '1px solid var(--border-light)' : '2px solid var(--bubble-sent)',
                    position: 'relative',
                    opacity: message.read ? 0.8 : 1
                  }}
                >
                  {!message.read && (
                    <div style={{
                      position: 'absolute',
                      top: '8px',
                      right: '8px',
                      width: '8px',
                      height: '8px',
                      background: 'var(--bubble-sent)',
                      borderRadius: '50%'
                    }} />
                  )}

                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <span style={{ 
                        fontSize: '12px', 
                        padding: '4px 8px',
                        borderRadius: '12px',
                        background: `rgba(${parseInt(getPriorityColor(message.priority).slice(1, 3), 16)}, ${parseInt(getPriorityColor(message.priority).slice(3, 5), 16)}, ${parseInt(getPriorityColor(message.priority).slice(5, 7), 16)}, 0.1)`,
                        color: getPriorityColor(message.priority),
                        fontWeight: '600'
                      }}>
                        {getPriorityLabel(message.priority)} ({message.priority})
                      </span>
                      <span style={{ 
                        fontSize: '12px', 
                        padding: '2px 6px',
                        borderRadius: '8px',
                        background: 'var(--bg-tertiary)',
                        color: 'var(--text-secondary)' 
                      }}>
                        {message.roomName}
                      </span>
                      {message.platform && (
                        <span style={{ 
                          fontSize: '10px', 
                          padding: '2px 4px',
                          borderRadius: '4px',
                          background: 'var(--border-light)',
                          color: 'var(--text-tertiary)',
                          textTransform: 'uppercase'
                        }}>
                          {message.platform}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                        {new Date(message.timestamp).toLocaleString([], { 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </span>
                      {!message.read && (
                        <div style={{
                          width: '6px',
                          height: '6px',
                          background: 'var(--bubble-sent)',
                          borderRadius: '50%'
                        }} />
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-primary)', 
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {message.senderName || message.sender}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5',
                        marginBottom: '8px'
                      }}>
                        {message.content}
                      </div>
                      
                      {/* Priority Reasons */}
                      {message.reasons && message.reasons.length > 0 && (
                        <div style={{ marginBottom: '8px' }}>
                          <div style={{ fontSize: '12px', color: 'var(--text-tertiary)', marginBottom: '4px' }}>
                            Priority factors:
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {message.reasons.map((reason, idx) => (
                              <span
                                key={idx}
                                style={{
                                  fontSize: '11px',
                                  padding: '2px 6px',
                                  borderRadius: '8px',
                                  background: 'rgba(59, 130, 246, 0.1)',
                                  color: '#3b82f6',
                                  border: '1px solid rgba(59, 130, 246, 0.2)'
                                }}
                              >
                                {reason}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {/* Suggested Action */}
                      {message.suggestedAction && (
                        <div style={{
                          fontSize: '12px',
                          color: '#10b981',
                          background: 'rgba(16, 185, 129, 0.1)',
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid rgba(16, 185, 129, 0.2)',
                          marginBottom: '8px'
                        }}>
                          💡 {message.suggestedAction}
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        onClick={() => markAsRead(message.id)}
                        style={{
                          padding: '8px',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '8px',
                          background: 'var(--bg-primary)',
                          cursor: 'pointer'
                        }}
                        title="Mark as read"
                      >
                        <CheckCircle size={16} color={message.read ? '#10b981' : 'var(--text-tertiary)'} />
                      </button>
                      
                      <Link 
                        to={`/messages?roomId=${message.roomId}`}
                        style={{
                          padding: '8px',
                          border: '1px solid var(--border-medium)',
                          borderRadius: '8px',
                          background: 'var(--bubble-sent)',
                          color: 'white',
                          cursor: 'pointer',
                          textDecoration: 'none',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        title="Go to conversation"
                      >
                        <ChevronRight size={16} />
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      {/* CSS Animations */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </Layout>
  );
}