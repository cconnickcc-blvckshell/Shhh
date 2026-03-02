import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, setToken, clearToken } from '../api/client';

export default function Login() {
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [devCode, setDevCode] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.sendCode(phone);
      setDevCode(res.data.devCode ?? null);
      setStep('code');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyAndLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const verifyRes = await adminApi.verify(phone, code);
      const sessionToken = verifyRes.data?.sessionToken;
      const res = await adminApi.login(phone, sessionToken);
      setToken(res.data.accessToken);

      try {
        const statsRes = await adminApi.getOverview();
        if (statsRes.data) {
          navigate('/');
        }
      } catch {
        setToken('');
        clearToken();
        setError('Access denied. Admin or moderator role required.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#050508' }}>
      <form onSubmit={step === 'phone' ? handleSendCode : handleVerifyAndLogin} style={{ background: '#0E0B16', padding: '3rem', borderRadius: '16px', width: '400px', border: '1px solid rgba(147,51,234,0.15)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', fontWeight: 900, color: '#A855F7', letterSpacing: '-1px' }}>Shhh</div>
          <div style={{ color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '2px', marginTop: '4px' }}>Command Center</div>
        </div>

        {step === 'phone' ? (
          <>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>ADMIN PHONE</div>
            <input
              type="text" value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="+15550000001"
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box', outline: 'none' }}
            />
          </>
        ) : (
          <>
            <div style={{ color: 'rgba(255,255,255,0.35)', fontSize: '0.65rem', fontWeight: 700, letterSpacing: '1.5px', marginBottom: '0.5rem', textTransform: 'uppercase' }}>VERIFICATION CODE</div>
            <input
              type="text" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.03)', color: '#fff', fontSize: '1rem', marginBottom: '1rem', boxSizing: 'border-box', outline: 'none' }}
            />
            {devCode && <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginBottom: '0.75rem' }}>Dev code: {devCode}</p>}
            <button type="button" onClick={() => { setStep('phone'); setCode(''); setError(''); }} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', cursor: 'pointer', marginBottom: '0.5rem' }}>← Change phone</button>
          </>
        )}

        {error && <p style={{ color: '#EF4444', fontSize: '0.875rem', marginBottom: '0.75rem', background: 'rgba(239,68,68,0.08)', padding: '8px 12px', borderRadius: '8px' }}>{error}</p>}
        <button
          type="submit" disabled={loading || (step === 'phone' ? !phone : code.length !== 6)}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', border: 'none', background: '#9333EA', color: '#fff', cursor: 'pointer', fontWeight: 700, fontSize: '1rem' }}
        >
          {loading ? 'Verifying...' : step === 'phone' ? 'Send code' : 'Verify & Login'}
        </button>
        <p style={{ color: 'rgba(255,255,255,0.15)', fontSize: '0.7rem', textAlign: 'center', marginTop: '1rem' }}>
          Only users with admin or moderator roles can access this dashboard.
        </p>
      </form>
    </div>
  );
}
