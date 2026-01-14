import { useState, useEffect } from 'react';
import { Download, X } from 'lucide-react';
import { useInstallPrompt } from '../hooks/useMobile';

export default function InstallPrompt() {
  const { installPrompt, isInstalled, promptInstall } = useInstallPrompt();
  const [showPrompt, setShowPrompt] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if user previously dismissed
    const wasDismissed = localStorage.getItem('install-prompt-dismissed');
    if (wasDismissed) {
      setDismissed(true);
      return;
    }

    // Show prompt after 30 seconds if not installed
    const timer = setTimeout(() => {
      if (installPrompt && !isInstalled) {
        setShowPrompt(true);
      }
    }, 30000);

    return () => clearTimeout(timer);
  }, [installPrompt, isInstalled]);

  const handleInstall = async () => {
    const installed = await promptInstall();
    if (installed) {
      setShowPrompt(false);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setDismissed(true);
    localStorage.setItem('install-prompt-dismissed', 'true');
  };

  if (!showPrompt || dismissed || isInstalled || !installPrompt) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      background: 'linear-gradient(135deg, #3b82f6 0%, #1e40af 100%)',
      color: 'white',
      padding: '16px',
      borderRadius: '12px',
      boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      animation: 'slideUp 0.3s ease'
    }}>
      <Download size={24} />
      <div style={{ flex: 1 }}>
        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 'bold' }}>
          Install CommHub
        </h3>
        <p style={{ margin: '4px 0 0 0', fontSize: '14px', opacity: 0.9 }}>
          Install our app for a better experience
        </p>
      </div>
      <button
        onClick={handleInstall}
        style={{
          background: 'white',
          color: '#3b82f6',
          border: 'none',
          padding: '8px 16px',
          borderRadius: '6px',
          fontWeight: 'bold',
          cursor: 'pointer',
          fontSize: '14px'
        }}
      >
        Install
      </button>
      <button
        onClick={handleDismiss}
        style={{
          background: 'transparent',
          border: 'none',
          color: 'white',
          cursor: 'pointer',
          padding: '8px'
        }}
      >
        <X size={20} />
      </button>
      <style>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}