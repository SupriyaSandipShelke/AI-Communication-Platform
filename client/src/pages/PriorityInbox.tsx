import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import { MessageSquare, AlertTriangle, Clock, CheckCircle, Star, ChevronRight, ArrowLeft } from 'lucide-react';
import '../styles/chatMessage.css';

interface PriorityMessage {
  id: string;
  sender: string;
  content: string;
  timestamp: Date;
  priority: number; // 0-100 scale
  roomId: string;
  roomName: string;
  read: boolean;
}

export default function PriorityInbox() {
  const [inbox, setInbox] = useState<PriorityMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    minPriority: 70,
    unreadOnly: false,
    daysBack: 7
  });

  useEffect(() => {
    loadPriorityInbox();
  }, [filters]);

  const loadPriorityInbox = async () => {
    try {
      setLoading(true);
      
      // Fetch priority inbox from API
      const response = await fetch(`/api/chat/priority/inbox`);
      const data = await response.json();
      
      if (data.success) {
        // Transform the data to match our interface
        const transformedInbox = data.inbox.map((item: any) => ({
          id: item.id || `msg-${Math.random()}`,
          sender: item.sender || 'Unknown',
          content: item.content || item.message || 'No content',
          timestamp: new Date(item.timestamp || item.createdAt),
          priority: item.priority || item.score || 50,
          roomId: item.roomId || item.chatId || 'unknown',
          roomName: item.roomName || item.chatName || 'General',
          read: item.read || item.isRead || false
        }));
        
        setInbox(transformedInbox);
      }
    } catch (error) {
      console.error('Failed to load priority inbox:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: number) => {
    if (priority >= 80) return '#ef4444'; // red
    if (priority >= 60) return '#f59e0b'; // amber
    if (priority >= 40) return '#10b981'; // green
    return '#6b7280'; // gray
  };

  const getPriorityLabel = (priority: number) => {
    if (priority >= 80) return 'Critical';
    if (priority >= 60) return 'High';
    if (priority >= 40) return 'Medium';
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
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
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
              {inbox.filter(m => m.priority >= 80).length}
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
              {inbox.filter(m => m.priority >= 60 && m.priority < 80).length}
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

        {/* Filters */}
        <div style={{
          background: 'var(--bg-secondary)',
          borderRadius: '12px',
          padding: '16px',
          marginBottom: '24px',
          display: 'flex',
          gap: '16px',
          flexWrap: 'wrap'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '4px' }}>
              Min Priority
            </label>
            <select
              value={filters.minPriority}
              onChange={(e) => setFilters({...filters, minPriority: Number(e.target.value)})}
              style={{
                padding: '8px 12px',
                border: '1px solid var(--border-medium)',
                borderRadius: '8px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)',
                fontSize: '14px'
              }}
            >
              <option value={50}>50+ (Medium)</option>
              <option value={60}>60+ (High)</option>
              <option value={70}>70+ (Important)</option>
              <option value={80}>80+ (Critical)</option>
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '16px' }}>
            <input
              type="checkbox"
              id="unreadOnly"
              checked={filters.unreadOnly}
              onChange={(e) => setFilters({...filters, unreadOnly: e.target.checked})}
              style={{ marginRight: '4px' }}
            />
            <label htmlFor="unreadOnly" style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              Unread only
            </label>
          </div>
        </div>

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
              .filter(msg => msg.priority >= filters.minPriority)
              .filter(msg => !filters.unreadOnly || !msg.read)
              .sort((a, b) => b.priority - a.priority)
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
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
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
                      <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                        {message.roomName}
                      </span>
                    </div>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-primary)', 
                        fontWeight: '500',
                        marginBottom: '4px'
                      }}>
                        {message.sender}
                      </div>
                      <div style={{ 
                        fontSize: '14px', 
                        color: 'var(--text-secondary)',
                        lineHeight: '1.5'
                      }}>
                        {message.content}
                      </div>
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
    </Layout>
  );
}