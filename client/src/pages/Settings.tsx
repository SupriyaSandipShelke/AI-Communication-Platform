import { useState } from 'react';
import Layout from '../components/Layout';
import SecurityStatus from '../components/SecurityStatus';
import { Save, Key, Bell, Shield, Zap } from 'lucide-react';

export default function Settings() {
  const [settings, setSettings] = useState({
    matrixHomeserver: 'https://matrix.org',
    matrixUserId: '',
    matrixAccessToken: '',
    openaiApiKey: '',
    slackBotToken: '',
    enableAISummary: true,
    enableAutoResponse: false,
    enableVoiceAssistant: true,
    dailySummaryTime: '18:00'
  });

  const [saved, setSaved] = useState(false);

  const handleChange = (field: string, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    // In a real app, this would save to backend
    console.log('Saving settings:', settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Layout>
      <div style={{ padding: '32px', maxWidth: '900px', margin: '0 auto' }}>
        <div style={{ marginBottom: '32px' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 'bold', color: 'white', marginBottom: '8px' }}>
            Settings
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '16px' }}>
            Configure your platforms and AI features
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Matrix Configuration */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Shield size={24} color="#667eea" />
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                Matrix.org Configuration
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Homeserver URL
                </label>
                <input
                  type="text"
                  value={settings.matrixHomeserver}
                  onChange={(e) => handleChange('matrixHomeserver', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  User ID
                </label>
                <input
                  type="text"
                  value={settings.matrixUserId}
                  onChange={(e) => handleChange('matrixUserId', e.target.value)}
                  placeholder="@username:matrix.org"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Access Token
                </label>
                <input
                  type="password"
                  value={settings.matrixAccessToken}
                  onChange={(e) => handleChange('matrixAccessToken', e.target.value)}
                  placeholder="Your Matrix access token"
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* AI Configuration */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Zap size={24} color="#f59e0b" />
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                AI Features
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  OpenAI API Key
                </label>
                <input
                  type="password"
                  value={settings.openaiApiKey}
                  onChange={(e) => handleChange('openaiApiKey', e.target.value)}
                  placeholder="sk-..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                    Enable AI Summaries
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Generate daily communication summaries
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAISummary}
                  onChange={(e) => handleChange('enableAISummary', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                    Enable Auto-Response
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Automatically respond to high-priority messages
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableAutoResponse}
                  onChange={(e) => handleChange('enableAutoResponse', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#1f2937', marginBottom: '4px' }}>
                    Voice Assistant
                  </div>
                  <div style={{ fontSize: '13px', color: '#6b7280' }}>
                    Enable voice-to-text features
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={settings.enableVoiceAssistant}
                  onChange={(e) => handleChange('enableVoiceAssistant', e.target.checked)}
                  style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                />
              </div>

              <div>
                <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Daily Summary Time
                </label>
                <input
                  type="time"
                  value={settings.dailySummaryTime}
                  onChange={(e) => handleChange('dailySummaryTime', e.target.value)}
                  style={{
                    width: '200px',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Platform Integrations */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Key size={24} color="#10b981" />
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                Platform Integrations
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              <div>
                <label style={{ display: 'block', color: '#374151', fontSize: '14px', fontWeight: '500', marginBottom: '8px' }}>
                  Slack Bot Token
                </label>
                <input
                  type="password"
                  value={settings.slackBotToken}
                  onChange={(e) => handleChange('slackBotToken', e.target.value)}
                  placeholder="xoxb-..."
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '8px',
                    fontSize: '14px'
                  }}
                />
                <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '8px' }}>
                  Get your bot token from <a href="https://api.slack.com/apps" target="_blank" style={{ color: '#667eea' }}>Slack API</a>
                </p>
              </div>

              <div style={{ padding: '16px', background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: '8px' }}>
                <p style={{ fontSize: '14px', color: '#0369a1', marginBottom: '8px', fontWeight: '600' }}>
                  📱 Additional Platforms
                </p>
                <p style={{ fontSize: '13px', color: '#0c4a6e' }}>
                  WhatsApp, Signal, and iMessage integrations coming soon! Configure your .env file to add more platforms.
                </p>
              </div>
            </div>
          </div>

          {/* Security Section */}
          <div style={{
            background: 'white',
            borderRadius: '12px',
            padding: '32px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
              <Shield size={24} color="#667eea" />
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: '#1f2937' }}>
                Security & Privacy
              </h2>
            </div>
            
            <SecurityStatus showAuditTrail={true} />
            
            <div style={{ marginTop: '20px', padding: '16px', background: '#f9fafb', borderRadius: '8px' }}>
              <h3 style={{ fontSize: '16px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
                Privacy Controls
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>
                      AI Processing Consent
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Allow AI to process your messages
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings.enableAISummary}
                    onChange={(e) => handleChange('enableAISummary', e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>
                      Data Encryption
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Encrypt stored messages and data
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    disabled
                    style={{ width: '20px', height: '20px', cursor: 'not-allowed', opacity: 0.5 }}
                  />
                </div>
                
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontWeight: '500', color: '#1f2937', marginBottom: '2px' }}>
                      Activity Logging
                    </div>
                    <div style={{ fontSize: '13px', color: '#6b7280' }}>
                      Log security events and activities
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    defaultChecked={true}
                    onChange={(e) => console.log('Activity logging changed:', e.target.checked)}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>
          </div>
          
          {/* Save Button */}
          <button
            onClick={handleSave}
            style={{
              width: '100%',
              padding: '16px',
              background: saved ? '#10b981' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              border: 'none',
              borderRadius: '12px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              transition: 'all 0.3s'
            }}
          >
            <Save size={20} />
            {saved ? 'Settings Saved!' : 'Save Settings'}
          </button>
        </div>
      </div>
    </Layout>
  );
}
