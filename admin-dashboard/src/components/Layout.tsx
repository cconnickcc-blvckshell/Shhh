import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { getToken } from '../api/client';
import { useEffect } from 'react';

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/users', label: 'Users', icon: '👥' },
  { path: '/revenue', label: 'Revenue', icon: '💰' },
  { path: '/venues', label: 'Venues', icon: '🏢' },
  { path: '/ads', label: 'Ads', icon: '📣' },
  { path: '/events', label: 'Events', icon: '🎉' },
  { path: '/reports', label: 'Reports', icon: '📋' },
  { path: '/safety', label: 'Safety', icon: '🚨' },
  { path: '/audit', label: 'Audit Log', icon: '📜' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export default function Layout() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (!getToken()) navigate('/login');
  }, [navigate]);

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#0a0a0f' }}>
      <nav style={{ width: 200, background: '#0e0b16', padding: '16px 0', borderRight: '1px solid #1a1a2e', flexShrink: 0 }}>
        <div style={{ padding: '0 16px', marginBottom: 20 }}>
          <h1 style={{ color: '#A855F7', fontSize: 18, margin: 0, fontWeight: 800 }}>Shhh</h1>
          <div style={{ color: '#555', fontSize: 10, marginTop: 2, textTransform: 'uppercase', letterSpacing: 1 }}>Command Center</div>
        </div>
        {navItems.map(item => {
          const isActive = location.pathname === item.path;
          return (
            <Link key={item.path} to={item.path}
              style={{
                display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px',
                color: isActive ? '#A855F7' : '#888', textDecoration: 'none', fontSize: 13, fontWeight: isActive ? 700 : 500,
                background: isActive ? 'rgba(147,51,234,0.08)' : 'transparent',
                borderRight: isActive ? '2px solid #A855F7' : '2px solid transparent',
              }}>
              <span style={{ fontSize: 14 }}>{item.icon}</span> {item.label}
            </Link>
          );
        })}
      </nav>
      <main style={{ flex: 1, padding: 24, overflowY: 'auto' }}>
        <Outlet />
      </main>
    </div>
  );
}
