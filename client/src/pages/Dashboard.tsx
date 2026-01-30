import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, Activity, AlertCircle, Home, BarChart, Settings as SettingsIcon, LogOut, Users, Bell, Clock, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import AIChatbot from '../components/AIChatbot';
import PlatformSelector from '../components/PlatformSelector';
import { activityTracker } from '../services/ActivityTracker';

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [loading, setLoading] = useState(true);
  const [selectedPlatform, setSelectedPlatform] = useState('whatsapp');

  useEffect(() => {
    loadData();
    
    // Add some demo activities if none exist (for demonstration)
    const todaysActivities = activityTracker.getTodaysActivities();
    if (todaysActivities.length === 0) {
      // Add some sample activities to demonstrate the feature
      activityTracker.trackMessageSent('whatsapp', 'John Doe', 'text');
      activityTracker.trackMessageSent('telegram', 'Project Team', 'text');
      activityTracker.trackGroupCreated('whatsapp', 'Family Group', 5);
      activityTracker.trackUserAdded('instagram', 'alice@example.com');
      activityTracker.trackCallMade('whatsapp', 'Mom', 'voice');
      activityTracker.trackFileShared('telegram', 'project-report.pdf', 'Project Team');
      
      // Reload data to show the new activities
      setTimeout(() => loadData(), 100);
    }
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Get today's summary from activity tracker
      let todaysSummary = activityTracker.getDailySummary();
      
      if (!todaysSummary) {
        // Generate new summary if none exists
        todaysSummary = activityTracker.generateTodaysSummary();
      }

      setSummary(todaysSummary);

      // Get activity stats for priority calculation
      const activityStats = activityTracker.getActivityStats(1); // Today's stats
      
      // Load priority stats from API or use activity-based stats
      try {
        const priorityRes = await fetch('/api/analytics/priority', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        const priorityData = await priorityRes.json();
        if (priorityData.success) {
          setStats({
            total: priorityData.counts.high + priorityData.counts.medium + priorityData.counts.low,
            high: priorityData.counts.high,
            medium: priorityData.counts.medium,
            low: priorityData.counts.low
          });
        } else {
          throw new Error('API not available');
        }
      } catch (error) {
        // Use activity-based stats as fallback
        const messagesSent = activityStats.activityTypes.message_sent || 0;
        const callsMade = activityStats.activityTypes.call_made || 0;
        const groupsCreated = activityStats.activityTypes.group_created || 0;
        const filesShared = activityStats.activityTypes.file_shared || 0;
        
        setStats({
          total: activityStats.totalActivities,
          high: callsMade + groupsCreated, // Calls and group creation are high priority
          medium: filesShared + Math.floor(messagesSent * 0.3), // File sharing and some messages are medium
          low: Math.floor(messagesSent * 0.7) // Most messages are low priority
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback to empty summary
      const emptySummary = activityTracker.generateTodaysSummary();
      setSummary(emptySummary);
      setStats({
        total: 0,
        high: 0,
        medium: 0,
        low: 0
      });
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ icon: Icon, title, value, color, bgColor }: any) => (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      display: 'flex',
      alignItems: 'center',
      gap: '16px'
    }}>
      <div style={{
        padding: '12px',
        borderRadius: '10px',
        background: bgColor
      }}>
        <Icon size={24} color={color} />
      </div>
      <div>
        <div style={{ color: '#6b7280', fontSize: '14px', marginBottom: '4px' }}>{title}</div>
        <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#1f2937' }}>{value}</div>
      </div>
    </div>
  );

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '1400px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: '#1f2937', marginBottom: '8px' }}>
            Dashboard
          </h1>
          <p style={{ color: '#6b7280', fontSize: '16px' }}>
            Welcome back! Here's your communication overview.
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#1f2937', padding: '48px' }}>
            Loading dashboard...
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '32px'
            }}>
              <StatCard
                icon={MessageSquare}
                title="Total Messages"
                value={stats.total}
                color="#667eea"
                bgColor="#e0e7ff"
              />
              <StatCard
                icon={AlertCircle}
                title="High Priority"
                value={stats.high}
                color="#ef4444"
                bgColor="#fee2e2"
              />
              <StatCard
                icon={TrendingUp}
                title="Medium Priority"
                value={stats.medium}
                color="#f59e0b"
                bgColor="#fef3c7"
              />
              <StatCard
                icon={Activity}
                title="Low Priority"
                value={stats.low}
                color="#10b981"
                bgColor="#d1fae5"
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '24px', marginBottom: '32px' }}>
              {/* Left Column - Platform Selector and Stats */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Platform Selector */}
                <PlatformSelector 
                  selectedPlatform={selectedPlatform}
                  onPlatformChange={setSelectedPlatform}
                  showTitle={true}
                />

                {summary && (
                  <div style={{
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    padding: '32px',
                    boxShadow: 'var(--shadow-md)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                      <div style={{
                        padding: '8px',
                        borderRadius: '8px',
                        background: 'rgba(102, 126, 234, 0.1)',
                        color: 'var(--text-link)'
                      }}>
                        <Sparkles size={20} />
                      </div>
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, flex: 1 }}>
                        Today's Summary - {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)}
                      </h2>
                      <button
                        onClick={() => {
                          const newSummary = activityTracker.generateTodaysSummary();
                          setSummary(newSummary);
                        }}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--accent-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '12px',
                          fontWeight: '500',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                        title="Refresh Summary"
                      >
                        <Activity size={14} />
                        Refresh
                      </button>
                    </div>
                    <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                      {summary.summary}
                    </p>
            
                    {summary.keyTopics && summary.keyTopics.length > 0 && (
                      <div style={{ marginBottom: '20px' }}>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          Key Topics
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                          {summary.keyTopics.map((topic: string, index: number) => (
                            <span
                              key={index}
                              style={{
                                padding: '6px 12px',
                                background: 'var(--bg-secondary)',
                                color: 'var(--text-primary)',
                                borderRadius: '20px',
                                fontSize: '14px',
                                fontWeight: '500'
                              }}
                            >
                              {topic}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
            
                    {summary.actionItems && summary.actionItems.length > 0 && (
                      <div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                          Action Items
                        </h3>
                        <ul style={{ paddingLeft: '20px' }}>
                          {summary.actionItems.map((item: string, index: number) => (
                            <li key={index} style={{ color: 'var(--text-secondary)', marginBottom: '8px' }}>
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}


            
                {/* Quick Links */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px'
                }}>
                  <Link to={`/messages?platform=${selectedPlatform}`} style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      border: '1px solid var(--border-light)'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          padding: '8px',
                          borderRadius: '8px',
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: 'var(--text-link)'
                        }}>
                          <MessageSquare size={20} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          {selectedPlatform.charAt(0).toUpperCase() + selectedPlatform.slice(1)} Messages
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Access messages from {selectedPlatform}
                      </p>
                    </div>
                  </Link>
            
                  <Link to="/messages" style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      border: '1px solid var(--border-light)'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          padding: '8px',
                          borderRadius: '8px',
                          background: 'rgba(239, 68, 68, 0.1)',
                          color: '#ef4444'
                        }}>
                          <Bell size={20} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          Priority Inbox
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Messages that need your attention
                      </p>
                    </div>
                  </Link>
            
                  <Link to="/analytics" style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      border: '1px solid var(--border-light)'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          padding: '8px',
                          borderRadius: '8px',
                          background: 'rgba(16, 185, 129, 0.1)',
                          color: '#10b981'
                        }}>
                          <BarChart size={20} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          Analytics
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        View detailed communication patterns
                      </p>
                    </div>
                  </Link>

                  <Link to="/groups" style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      border: '1px solid var(--border-light)'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          padding: '8px',
                          borderRadius: '8px',
                          background: 'rgba(59, 130, 246, 0.1)',
                          color: '#3b82f6'
                        }}>
                          <Users size={20} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          Groups
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Manage your group conversations
                      </p>
                    </div>
                  </Link>

                  <Link to="/status" style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      border: '1px solid var(--border-light)'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          padding: '8px',
                          borderRadius: '8px',
                          background: 'rgba(168, 85, 247, 0.1)',
                          color: '#a855f7'
                        }}>
                          <Activity size={20} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          Status
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Share and view status updates
                      </p>
                    </div>
                  </Link>

                  <Link to="/settings" style={{ textDecoration: 'none' }}>
                    <div style={{
                      background: 'var(--bg-primary)',
                      borderRadius: '12px',
                      padding: '20px',
                      boxShadow: 'var(--shadow-sm)',
                      cursor: 'pointer',
                      transition: 'transform 0.2s',
                      border: '1px solid var(--border-light)'
                    }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                      onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                        <div style={{
                          padding: '8px',
                          borderRadius: '8px',
                          background: 'rgba(107, 114, 128, 0.1)',
                          color: '#6b7280'
                        }}>
                          <SettingsIcon size={20} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          Settings
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Customize your experience
                      </p>
                    </div>
                  </Link>
                </div>
              </div>
            
              {/* Right Column - AI Assistant and Recent Activities */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* AI Assistant */}
                <div style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-md)',
                  height: 'fit-content',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
                    <div style={{
                      padding: '10px',
                      borderRadius: '10px',
                      background: 'var(--bubble-sent)',
                      color: 'white'
                    }}>
                      <Sparkles size={20} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '18px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                        AI Assistant
                      </h3>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Ask me about your communications
                      </p>
                    </div>
                  </div>
                  <AIChatbot userId={localStorage.getItem('username') || undefined} />
                </div>

                {/* Recent Activities */}
                <div style={{
                  background: 'var(--bg-primary)',
                  borderRadius: '12px',
                  padding: '24px',
                  boxShadow: 'var(--shadow-md)',
                  border: '1px solid var(--border-light)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                    <div style={{
                      padding: '8px',
                      borderRadius: '8px',
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10b981'
                    }}>
                      <Clock size={20} />
                    </div>
                    <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                      Recent Activities
                    </h2>
                  </div>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '300px', overflowY: 'auto' }}>
                    {activityTracker.getTodaysActivities().slice(-5).reverse().map((activity, index) => (
                      <div key={activity.id} style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '12px',
                        padding: '12px',
                        background: 'var(--bg-secondary)',
                        borderRadius: '8px',
                        border: '1px solid var(--border-light)'
                      }}>
                        <div style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          background: activity.platform === 'whatsapp' ? '#25D366' : 
                                     activity.platform === 'telegram' ? '#0088cc' :
                                     activity.platform === 'instagram' ? '#E4405F' :
                                     activity.platform === 'slack' ? '#4A154B' :
                                     activity.platform === 'matrix' ? '#0DBD8B' : '#3b82f6'
                        }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: '500' }}>
                            {activity.description}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {activity.platform.charAt(0).toUpperCase() + activity.platform.slice(1)} • {activity.timestamp.toLocaleTimeString()}
                          </div>
                        </div>
                      </div>
                    ))}
                    
                    {activityTracker.getTodaysActivities().length === 0 && (
                      <div style={{ 
                        textAlign: 'center', 
                        color: 'var(--text-secondary)', 
                        padding: '20px',
                        fontStyle: 'italic'
                      }}>
                        No activities today. Start messaging to see your activity here!
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
