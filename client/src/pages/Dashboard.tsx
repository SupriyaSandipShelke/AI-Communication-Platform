import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MessageSquare, TrendingUp, Activity, AlertCircle, Home, BarChart, Settings as SettingsIcon, LogOut, Users, Bell, Clock, Sparkles } from 'lucide-react';
import Layout from '../components/Layout';
import AIChatbot from '../components/AIChatbot';

export default function Dashboard() {
  const [summary, setSummary] = useState<any>(null);
  const [stats, setStats] = useState({
    total: 0,
    high: 0,
    medium: 0,
    low: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      
      // Load today's summary
      const summaryRes = await fetch('/api/messages/summary/daily', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      const summaryData = await summaryRes.json();
      if (summaryData.success) {
        setSummary(summaryData.summary);
      } else {
        // Demo summary data
        setSummary({
          summary: "Today you've been active across multiple platforms with a focus on project coordination and team communication. Most conversations were productive with quick response times.",
          keyTopics: ["Project Updates", "Team Meetings", "Client Feedback", "Technical Discussion"],
          actionItems: ["Follow up on client proposal", "Schedule team meeting for next week", "Review technical specifications"]
        });
      }

      // Load priority stats
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
        // Demo stats data
        setStats({
          total: 147,
          high: 8,
          medium: 34,
          low: 105
        });
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Fallback demo data
      setSummary({
        summary: "Welcome to your communication hub! Start by adding users and creating groups to see your activity summary here.",
        keyTopics: ["Getting Started", "User Management", "Group Creation"],
        actionItems: ["Add your first contact", "Create a group chat", "Post a status update"]
      });
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
              {/* Left Column - Stats and Summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
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
                      <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>
                        Today's Summary
                      </h2>
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
                          background: 'rgba(102, 126, 234, 0.1)',
                          color: 'var(--text-link)'
                        }}>
                          <MessageSquare size={20} />
                        </div>
                        <h3 style={{ fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
                          All Messages
                        </h3>
                      </div>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '14px', margin: 0 }}>
                        Access unified messages from all platforms
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
            
              {/* Right Column - AI Assistant */}
              <div>
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
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
