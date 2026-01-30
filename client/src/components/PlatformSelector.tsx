import React, { useState, useEffect } from 'react';
import { PlatformService } from '../services/PlatformService';

interface PlatformStatus {
  telegram: boolean;
  instagram: boolean;
  matrix: boolean;
  whatsapp: boolean;
  slack: boolean;
}

interface PlatformSelectorProps {
  selectedPlatform: string;
  onPlatformChange: (platform: string) => void;
  compact?: boolean;
  showTitle?: boolean;
}

const PlatformSelector: React.FC<PlatformSelectorProps> = ({
  selectedPlatform,
  onPlatformChange,
  compact = false,
  showTitle = true
}) => {
  const [platformStatus, setPlatformStatus] = useState<PlatformStatus>({
    telegram: true, // Show as connected for demo
    instagram: true, // Show as connected for demo
    matrix: true, // Show as connected for demo
    whatsapp: true, // Always available
    slack: true // Show as connected for demo
  });

  useEffect(() => {
    const checkPlatformStatus = async () => {
      const status = await PlatformService.getAllPlatformStatuses();
      setPlatformStatus(status);
    };

    checkPlatformStatus();
    // Check status every 30 seconds
    const interval = setInterval(checkPlatformStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const platforms = [
    { id: 'whatsapp', name: 'WhatsApp', icon: '📱', color: '#25D366', description: 'Business messaging' },
    { id: 'telegram', name: 'Telegram', icon: '✈️', color: '#0088cc', description: 'Fast & secure' },
    { id: 'instagram', name: 'Instagram', icon: '📷', color: '#E4405F', description: 'Visual messaging' },
    { id: 'matrix', name: 'Matrix', icon: '🔗', color: '#0DBD8B', description: 'Decentralized chat' },
    { id: 'slack', name: 'Slack', icon: '💬', color: '#4A154B', description: 'Team collaboration' }
  ];

  if (compact) {
    return (
      <div style={{
        display: 'flex',
        gap: '8px',
        padding: '8px',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        border: '1px solid var(--border-light)'
      }}>
        {platforms.map((platform) => {
          const isConnected = platformStatus[platform.id as keyof PlatformStatus];
          const isSelected = selectedPlatform === platform.id;
          
          return (
            <button
              key={platform.id}
              onClick={() => onPlatformChange(platform.id)}
              disabled={!isConnected}
              title={`${platform.name} - ${isConnected ? 'Connected' : 'Disconnected'}`}
              style={{
                padding: '8px 12px',
                border: `2px solid ${isSelected ? platform.color : 'var(--border-medium)'}`,
                borderRadius: '6px',
                background: isSelected ? `${platform.color}15` : 'var(--bg-primary)',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                opacity: isConnected ? 1 : 0.5,
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '12px',
                fontWeight: '500',
                color: isSelected ? platform.color : 'var(--text-primary)',
                transition: 'all 0.2s ease'
              }}
            >
              <span style={{ fontSize: '14px' }}>{platform.icon}</span>
              <span>{platform.name}</span>
              <span style={{ fontSize: '8px' }}>
                {isConnected ? '🟢' : '🔴'}
              </span>
            </button>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{
      padding: '20px',
      background: 'var(--bg-primary)',
      borderRadius: '12px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      border: '1px solid var(--border-light)'
    }}>
      {showTitle && (
        <h3 style={{ 
          margin: '0 0 16px 0', 
          color: 'var(--text-primary)', 
          fontSize: '18px',
          fontWeight: '600'
        }}>
          Choose Platform
        </h3>
      )}
      
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: '12px'
      }}>
        {platforms.map((platform) => {
          const isConnected = platformStatus[platform.id as keyof PlatformStatus];
          const isSelected = selectedPlatform === platform.id;
          
          return (
            <button
              key={platform.id}
              onClick={() => onPlatformChange(platform.id)}
              disabled={!isConnected}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '16px 12px',
                border: `2px solid ${isSelected ? platform.color : 'var(--border-medium)'}`,
                borderRadius: '12px',
                background: isSelected ? `${platform.color}10` : 'var(--bg-secondary)',
                cursor: isConnected ? 'pointer' : 'not-allowed',
                transition: 'all 0.2s ease',
                position: 'relative',
                opacity: isConnected ? 1 : 0.6
              }}
              onMouseEnter={(e) => {
                if (isConnected) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
                }
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{
                fontSize: '28px',
                marginBottom: '8px'
              }}>
                {platform.icon}
              </div>
              
              <div style={{
                fontSize: '14px',
                fontWeight: '600',
                color: isSelected ? platform.color : 'var(--text-primary)',
                marginBottom: '4px',
                textAlign: 'center'
              }}>
                {platform.name}
              </div>
              
              <div style={{
                fontSize: '11px',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                marginBottom: '8px'
              }}>
                {platform.description}
              </div>
              
              <div style={{
                position: 'absolute',
                top: '8px',
                right: '8px',
                fontSize: '10px'
              }}>
                {isConnected ? '🟢' : '🔴'}
              </div>
              
              {isSelected && (
                <div style={{
                  position: 'absolute',
                  bottom: '8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: platform.color,
                  color: 'white',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  fontSize: '10px',
                  fontWeight: '600'
                }}>
                  ACTIVE
                </div>
              )}
            </button>
          );
        })}
      </div>
      
      <div style={{
        marginTop: '16px',
        padding: '12px',
        background: 'var(--bg-secondary)',
        borderRadius: '8px',
        fontSize: '12px',
        color: 'var(--text-secondary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
          <span>🟢 Connected</span>
          <span>🔴 Disconnected</span>
        </div>
        <div>
          Configure platform credentials in Settings to enable all features.
        </div>
      </div>
    </div>
  );
};

export default PlatformSelector;