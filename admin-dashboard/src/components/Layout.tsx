import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getToken } from '../api/client';
import { useEffect } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/reports', label: 'Reports', icon: '🚨' },
  { path: '/audit', label: 'Audit Log', icon: '📋' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) navigate('/login');
  }, [navigate]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0f0f0f' }}>
      <nav style={{ width: '220px', background: '#1a1a2e', padding: '1.5rem 0', borderRight: '1px solid #222' }}>
        <div style={{ padding: '0 1.5rem', marginBottom: '2rem' }}>
          <h1 style={{ color: '#e94560', fontSize: '1.25rem', margin: 0 }}>Shhh Admin</h1>
          <div style={{ color: '#666', fontSize: '0.75rem' }}>Moderation Panel</div>
        </div>
        {navItems.map(item => (
          <Link key={item.path} to={item.path}
            style={{
              display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem 1.5rem',
              color: location.pathname === item.path ? '#e94560' : '#aaa', textDecoration: 'none',
              background: location.pathname === item.path ? 'rgba(233,69,96,0.1)' : 'transparent',
              borderRight: location.pathname === item.path ? '3px solid #e94560' : '3px solid transparent',
            }}>
            <span>{item.icon}</span> {item.label}
          </Link>
        ))}
      </nav>
      <main style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
