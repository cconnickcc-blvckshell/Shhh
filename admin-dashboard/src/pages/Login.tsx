import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { adminApi, setToken, clearToken } from '../api/client';
import { GlassInput } from '../components/GlassInput';
import { GlassButton } from '../components/GlassButton';
import { theme } from '../theme';

type AuthMode = 'phone' | 'email';

export default function Login() {
  const [authMode, setAuthMode] = useState<AuthMode>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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

  const handleBypass = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.bypassLogin();
      setToken(res.data.accessToken);
      const statsRes = await adminApi.getOverview();
      if (statsRes.data) {
        navigate('/');
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Bypass failed';
      const isNetwork = /fetch|network|cors/i.test(msg) || msg === 'Failed to fetch';
      setError(isNetwork
        ? `${msg} — Ensure VITE_API_URL points to your Render backend (Vercel → Settings → Environment Variables)`
        : msg);
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

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await adminApi.loginEmail(email.trim().toLowerCase(), password);
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
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      minHeight: '100vh',
      padding: theme.space[6],
    }}>
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          background: theme.glass.bg,
          backdropFilter: theme.glass.blur,
          WebkitBackdropFilter: theme.glass.blur,
          border: theme.glass.border,
          borderRadius: theme.radius.xl,
          padding: theme.space[8],
          boxShadow: theme.glass.shadow,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: theme.space[8] }}>
          <div style={{
            fontFamily: theme.font.display,
            fontSize: theme.fontSize['3xl'],
            fontWeight: theme.fontWeight.bold,
            color: theme.colors.primary,
            letterSpacing: '-1px',
          }}>
            Shhh
          </div>
          <div style={{
            color: theme.colors.textDim,
            fontSize: theme.fontSize.xs,
            textTransform: 'uppercase',
            letterSpacing: '2.5px',
            marginTop: theme.space[2],
          }}>
            Command Center
          </div>
        </div>

        {import.meta.env.VITE_ALLOW_BYPASS === 'true' && (
          <GlassButton
            type="button"
            variant="secondary"
            onClick={handleBypass}
            disabled={loading}
            style={{
              width: '100%',
              padding: `${theme.space[3]} ${theme.space[4]}`,
              marginBottom: theme.space[6],
              borderStyle: 'dashed',
            }}
          >
            {loading ? '...' : 'Skip login (dev bypass)'}
          </GlassButton>
        )}

        {import.meta.env.VITE_ALLOW_BYPASS === 'true' && (
          <div style={{
            color: theme.colors.textDim,
            fontSize: theme.fontSize.xs,
            textAlign: 'center',
            marginBottom: theme.space[4],
          }}>
            — or sign in with phone or email —
          </div>
        )}

        <div style={{ display: 'flex', gap: theme.space[2], marginBottom: theme.space[4] }}>
          <button
            type="button"
            onClick={() => { setAuthMode('phone'); setError(''); setStep('phone'); setCode(''); }}
            style={{
              flex: 1,
              padding: theme.space[2],
              borderRadius: theme.radius.md,
              border: `1px solid ${authMode === 'phone' ? theme.colors.primary : theme.colors.primaryBorder}`,
              background: authMode === 'phone' ? theme.colors.primaryMuted : 'transparent',
              color: authMode === 'phone' ? theme.colors.primary : theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              cursor: 'pointer',
              fontWeight: authMode === 'phone' ? theme.fontWeight.semibold : theme.fontWeight.normal,
            }}
          >
            Phone
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('email'); setError(''); }}
            style={{
              flex: 1,
              padding: theme.space[2],
              borderRadius: theme.radius.md,
              border: `1px solid ${authMode === 'email' ? theme.colors.primary : theme.colors.primaryBorder}`,
              background: authMode === 'email' ? theme.colors.primaryMuted : 'transparent',
              color: authMode === 'email' ? theme.colors.primary : theme.colors.textMuted,
              fontSize: theme.fontSize.sm,
              cursor: 'pointer',
              fontWeight: authMode === 'email' ? theme.fontWeight.semibold : theme.fontWeight.normal,
            }}
          >
            Email
          </button>
        </div>

        {authMode === 'email' ? (
          <form onSubmit={handleEmailLogin}>
            <GlassInput
              label="Email"
              value={email}
              onChange={setEmail}
              placeholder="admin@example.com"
              type="email"
            />
            <GlassInput
              label="Password"
              value={password}
              onChange={setPassword}
              placeholder="••••••••"
              type="password"
            />
            {error && (
              <div style={{
                background: theme.colors.dangerMuted,
                border: `1px solid ${theme.colors.danger}`,
                borderRadius: theme.radius.md,
                padding: theme.space[3],
                color: theme.colors.danger,
                fontSize: theme.fontSize.sm,
                marginBottom: theme.space[4],
              }}>
                {error}
              </div>
            )}
            <GlassButton
              type="submit"
              variant="primary"
              style={{ width: '100%', padding: `${theme.space[3]} ${theme.space[4]}` }}
              disabled={loading || !email.trim() || password.length < 8}
            >
              {loading ? 'Signing in...' : 'Sign in with email'}
            </GlassButton>
          </form>
        ) : (
          <>
            <form onSubmit={step === 'phone' ? handleSendCode : handleVerifyAndLogin}>
              {step === 'phone' ? (
                <GlassInput
                  label="Admin phone"
                  value={phone}
                  onChange={setPhone}
                  placeholder="+15550000001"
                />
              ) : (
                <>
                  <GlassInput
                    label="Verification code"
                    value={code}
                    onChange={(v) => setCode(v.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                  />
                  {devCode && (
                    <p style={{
                      color: theme.colors.textMuted,
                      fontSize: theme.fontSize.sm,
                      marginBottom: theme.space[3],
                    }}>
                      Dev code: {devCode}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setCode(''); setError(''); }}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: theme.colors.textMuted,
                      fontSize: theme.fontSize.sm,
                      cursor: 'pointer',
                      marginBottom: theme.space[3],
                    }}
                  >
                    ← Change phone
                  </button>
                </>
              )}

              {error && (
                <div style={{
                  background: theme.colors.dangerMuted,
                  border: `1px solid ${theme.colors.danger}`,
                  borderRadius: theme.radius.md,
                  padding: theme.space[3],
                  color: theme.colors.danger,
                  fontSize: theme.fontSize.sm,
                  marginBottom: theme.space[4],
                }}>
                  {error}
                </div>
              )}

              <GlassButton
                type="submit"
                variant="primary"
                style={{ width: '100%', padding: `${theme.space[3]} ${theme.space[4]}` }}
                disabled={loading || (step === 'phone' ? !phone : code.length !== 6)}
              >
                {loading ? 'Verifying...' : step === 'phone' ? 'Send code' : 'Verify & Login'}
              </GlassButton>
            </form>
          </>
        )}

        <p style={{
          color: theme.colors.textDim,
          fontSize: theme.fontSize.xs,
          textAlign: 'center',
          marginTop: theme.space[5],
        }}>
          Admin or moderator role required.
        </p>
      </div>
    </div>
  );
}
