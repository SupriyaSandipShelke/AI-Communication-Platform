import { useState, useEffect } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Eye, EyeOff, Clock, User, AlertTriangle } from 'lucide-react';

interface SecurityEvent {
  id: string;
  timestamp: Date;
  action: string;
  user: string;
  details: string;
  severity: 'info' | 'warning' | 'critical';
}

interface SecurityStatusProps {
  roomId?: string;
  userId?: string;
  showAuditTrail?: boolean;
}

export default function SecurityStatus({ roomId, userId, showAuditTrail = true }: SecurityStatusProps) {
  const [encryptionStatus, setEncryptionStatus] = useState<'enabled' | 'disabled' | 'pending'>('pending');
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([]);
  const [showAudit, setShowAudit] = useState(showAuditTrail);

  useEffect(() => {
    // Simulate loading security status
    setTimeout(() => {
      setEncryptionStatus('enabled');
    }, 500);

    // Load security events
    const mockEvents: SecurityEvent[] = [
      {
        id: '1',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        action: 'Message Sent',
        user: 'You',
        details: 'Encrypted message sent',
        severity: 'info'
      },
      {
        id: '2',
        timestamp: new Date(Date.now() - 7200000), // 2 hours ago
        action: 'Login',
        user: 'You',
        details: 'Secure login from browser',
        severity: 'info'
      },
      {
        id: '3',
        timestamp: new Date(Date.now() - 86400000), // 1 day ago
        action: 'Settings Updated',
        user: 'You',
        details: 'Privacy settings updated',
        severity: 'info'
      }
    ];
    
    setSecurityEvents(mockEvents);
  }, [roomId, userId]);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return '#ef4444';
      case 'warning': return '#f59e0b';
      case 'info': return '#10b981';
      default: return '#6b7280';
    }
  };

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case 'critical': return <AlertTriangle size={14} color="#ef4444" />;
      case 'warning': return <AlertTriangle size={14} color="#f59e0b" />;
      case 'info': return <ShieldCheck size={14} color="#10b981" />;
      default: return <Shield size={14} />;
    }
  };

  return (
    <div style={{
      background: 'var(--bg-primary)',
      borderRadius: '12px',
      padding: '16px',
      border: '1px solid var(--border-medium)',
      marginBottom: '16px'
    }}>
      {/* Encryption Status */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
        {encryptionStatus === 'enabled' ? (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(16, 185, 129, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#10b981'
          }}>
            <ShieldCheck size={20} />
          </div>
        ) : encryptionStatus === 'disabled' ? (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(239, 68, 68, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#ef4444'
          }}>
            <ShieldAlert size={20} />
          </div>
        ) : (
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '50%',
            background: 'rgba(156, 163, 175, 0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#9ca3af'
          }}>
            <Shield size={20} />
          </div>
        )}
        
        <div>
          <h4 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)' }}>
            {encryptionStatus === 'enabled' ? 'End-to-End Encryption' : 
             encryptionStatus === 'disabled' ? 'Encryption Disabled' : 'Checking Encryption'}
          </h4>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-secondary)' }}>
            {encryptionStatus === 'enabled' ? 'Messages are securely encrypted' : 
             encryptionStatus === 'disabled' ? 'Messages are not encrypted' : 'Verifying encryption status...'}
          </p>
        </div>
      </div>

      {/* Privacy Controls */}
      <div style={{ marginBottom: '16px' }}>
        <h5 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
          Privacy Controls
        </h5>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <div style={{
            padding: '6px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Eye size={12} />
            Visible to you
          </div>
          <div style={{
            padding: '6px 12px',
            background: 'var(--bg-secondary)',
            borderRadius: '16px',
            fontSize: '12px',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}>
            <Shield size={12} />
            Secure
          </div>
        </div>
      </div>

      {/* Consent Banner */}
      <div style={{
        background: 'rgba(16, 185, 129, 0.1)',
        border: '1px solid rgba(16, 185, 129, 0.2)',
        borderRadius: '8px',
        padding: '12px',
        marginBottom: '16px'
      }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          <div style={{ color: '#10b981', marginTop: '2px' }}>
            <ShieldCheck size={16} />
          </div>
          <div>
            <h5 style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)' }}>
              AI Consent Active
            </h5>
            <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.4' }}>
              AI features are enabled with your consent. Messages may be processed for summaries and insights.
            </p>
          </div>
        </div>
      </div>

      {/* Toggle Audit Trail */}
      {showAuditTrail && (
        <button
          onClick={() => setShowAudit(!showAudit)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-medium)',
            borderRadius: '8px',
            color: 'var(--text-primary)',
            cursor: 'pointer',
            fontSize: '14px',
            marginBottom: '12px'
          }}
        >
          {showAudit ? <EyeOff size={16} /> : <Eye size={16} />}
          {showAudit ? 'Hide' : 'Show'} Security Events
        </button>
      )}

      {/* Audit Trail */}
      {showAudit && securityEvents.length > 0 && (
        <div>
          <h5 style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' }}>
            Recent Security Events
          </h5>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {securityEvents.map((event) => (
              <div
                key={event.id}
                style={{
                  padding: '12px',
                  background: 'var(--bg-secondary)',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: '8px'
                }}
              >
                <div style={{ color: getSeverityColor(event.severity), marginTop: '2px' }}>
                  {getSeverityIcon(event.severity)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                    <span style={{ fontSize: '14px', fontWeight: '500', color: 'var(--text-primary)' }}>
                      {event.action}
                    </span>
                    <span style={{ fontSize: '12px', color: 'var(--text-tertiary)' }}>
                      {event.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    <User size={12} />
                    <span>{event.user}</span>
                    <Clock size={12} />
                    <span>{event.timestamp.toLocaleDateString()}</span>
                  </div>
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {event.details}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}