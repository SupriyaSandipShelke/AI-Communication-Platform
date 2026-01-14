import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Messages from './pages/Messages';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import PriorityInbox from './pages/PriorityInbox';
import Groups from './pages/Groups';
import InstallPrompt from './components/InstallPrompt';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for existing auth token
    const token = localStorage.getItem('auth_token');
    if (token) {
      // Verify token with backend
      fetch('/api/auth/verify', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      })
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setIsAuthenticated(true);
            // Store user_id if not already stored
            if (data.user && data.user.id && !localStorage.getItem('user_id')) {
              localStorage.setItem('user_id', data.user.id);
            }
          } else {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('username');
            localStorage.removeItem('user_id');
          }
        })
        .catch(() => {
          localStorage.removeItem('auth_token');
          localStorage.removeItem('username');
          localStorage.removeItem('user_id');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        color: 'white',
        fontSize: '24px'
      }}>
        Loading...
      </div>
    );
  }

  return (
    <>
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Login onLogin={() => setIsAuthenticated(true)} />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isAuthenticated ? (
                <Dashboard />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/messages"
            element={
              isAuthenticated ? (
                <Messages />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/analytics"
            element={
              isAuthenticated ? (
                <Analytics />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/settings"
            element={
              isAuthenticated ? (
                <Settings />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/priority-inbox"
            element={
              isAuthenticated ? (
                <PriorityInbox />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/groups"
            element={
              isAuthenticated ? (
                <Groups />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route 
            path="/" 
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            } 
          />
        </Routes>
      </Router>
      {isAuthenticated && <InstallPrompt />}
    </>
  );
}

export default App;