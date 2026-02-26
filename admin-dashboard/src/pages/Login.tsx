import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, setToken } from '../api/client';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.login(phone);
      setToken(res.data.accessToken);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0f0f0f' }}>
      <form onSubmit={handleLogin} style={{ background: '#1a1a2e', padding: '2rem', borderRadius: '12px', width: '360px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }}>
        <h1 style={{ color: '#e94560', textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>🔐 Shhh Admin</h1>
        <input
          type="text" value={phone} onChange={e => setPhone(e.target.value)}
          placeholder="Phone number (+15551001001)"
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #333', background: '#16213e', color: '#fff', marginBottom: '1rem', boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#e94560', fontSize: '0.875rem', marginBottom: '0.5rem' }}>{error}</p>}
        <button
          type="submit" disabled={loading}
          style={{ width: '100%', padding: '12px', borderRadius: '8px', border: 'none', background: '#e94560', color: '#fff', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {loading ? 'Logging in...' : 'Login'}
        </button>
      </form>
    </div>
  );
}
