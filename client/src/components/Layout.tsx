import { ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, MessageSquare, BarChart, Settings, LogOut, AlertTriangle, Users, Eye } from 'lucide-react';

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('username');
    navigate('/login');
  };

  const NavLink = ({ to, icon: Icon, label }: { to: string; icon: any; label: string }) => {
    const isActive = location.pathname === to;
    return (
      <Link
        to={to}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '12px 16px',
          borderRadius: '8px',
          textDecoration: 'none',
          color: isActive ? '#667eea' : 'white',
          background: isActive ? 'rgba(255,255,255,0.2)' : 'transparent',
          transition: 'background 0.2s',
          fontWeight: '500'
        }}
        onMouseEnter={(e) => !isActive && (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
        onMouseLeave={(e) => !isActive && (e.currentTarget.style.background = 'transparent')}
      >
        <Icon size={20} />
        <span>{label}</span>
      </Link>
    );
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      {/* Sidebar */}
      <div style={{
        width: '250px',
        background: 'rgba(0,0,0,0.2)',
        padding: '24px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ marginBottom: '40px' }}>
          <h2 style={{ color: 'white', fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
            CommHub
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
            AI Communication Platform
          </p>
        </div>

        <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <NavLink to="/dashboard" icon={Home} label="Dashboard" />
          <NavLink to="/messages" icon={MessageSquare} label="Messages" />
          <NavLink to="/groups" icon={Users} label="Groups" />
          <NavLink to="/priority-inbox" icon={AlertTriangle} label="Priority Inbox" />
          <NavLink to="/analytics" icon={BarChart} label="Analytics" />
          <NavLink to="/settings" icon={Settings} label="Settings" />
        </nav>

        <button
          onClick={handleLogout}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: '8px',
            border: 'none',
            background: 'rgba(239,68,68,0.2)',
            color: 'white',
            cursor: 'pointer',
            fontWeight: '500',
            fontSize: '14px',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.3)'}
          onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(239,68,68,0.2)'}
        >
          <LogOut size={20} />
          <span>Logout</span>
        </button>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        {children}
      </div>
    </div>
  );
}
