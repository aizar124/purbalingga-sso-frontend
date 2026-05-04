import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import {
  DEFAULT_SCOPE,
  PAY_REDIRECT_URI,
  SSO_BASE_URL,
  SSO_REDIRECT_URI,
} from '../config/sso';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
  const { loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaTempToken, setMfaTempToken] = useState<string | null>(null);
  const [localError, setError] = useState<string | null>(null);
  const oauthKeys = [
    'response_type',
    'client_id',
    'redirect_uri',
    'scope',
    'state',
    'code_challenge',
    'code_challenge_method',
    'nonce',
  ] as const;
  const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || 'purbalingga-sso';
  const PAY_CLIENT_ID = import.meta.env.VITE_PAY_CLIENT_ID || 'purbalingga-pay';
  const SCOPE = import.meta.env.VITE_SCOPE || DEFAULT_SCOPE;
  const DEFAULT_TARGET_APP: 'sso' | 'pay' = 'sso';

  const resolveTargetApp = () => {
    const params = new URLSearchParams(window.location.search);
    const redirectUri = params.get('redirect_uri');

    if (redirectUri === PAY_REDIRECT_URI) {
      return 'pay' as const;
    }

    return DEFAULT_TARGET_APP;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const hasIncomingOauthRequest = Boolean(params.get('client_id') || params.get('redirect_uri') || params.get('state'));

    if (!hasIncomingOauthRequest) {
      localStorage.removeItem('pkce_verifier');
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_nonce');
      localStorage.removeItem('oauth_response_type');
      localStorage.removeItem('oauth_client_id');
      localStorage.removeItem('oauth_redirect_uri');
      localStorage.removeItem('oauth_scope');
      localStorage.removeItem('oauth_code_challenge');
      localStorage.removeItem('oauth_code_challenge_method');
      return;
    }

    for (const key of oauthKeys) {
      const value = params.get(key);
      if (value) {
        localStorage.setItem(`oauth_${key}`, value);
      }
    }
  }, []);

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: 'easeOut' },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -10 },
    visible: (i: number) => ({
      opacity: 1,
      x: 0,
      transition: { delay: i * 0.1, duration: 0.4 },
    }),
  };

  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const generateCodeChallenge = async (verifier: string) => {
    const encoder = new TextEncoder();
    const data = encoder.encode(verifier);
    const hash = await crypto.subtle.digest('SHA-256', data);
    const bytes = new Uint8Array(hash);
    let binary = '';
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  };

  const continueAfterLogin = async () => {
    const params = new URLSearchParams(window.location.search);
    const oauthParams = new URLSearchParams();

    for (const key of oauthKeys) {
      const value = params.get(key) || localStorage.getItem(`oauth_${key}`);
      if (value) {
        oauthParams.set(key, value);
        localStorage.setItem(`oauth_${key}`, value);
      }
    }

    const targetApp = oauthParams.get('redirect_uri') === PAY_REDIRECT_URI ? 'pay' : resolveTargetApp();

    if (!oauthParams.get('client_id') || !oauthParams.get('redirect_uri')) {
      const codeVerifier = generateRandomString(128);
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      const nonce = generateRandomString(32);
      const clientId = targetApp === 'pay' ? PAY_CLIENT_ID : SSO_CLIENT_ID;
      const redirectUri = targetApp === 'pay' ? PAY_REDIRECT_URI : SSO_REDIRECT_URI;

      localStorage.setItem('pkce_verifier', codeVerifier);
      localStorage.setItem('oauth_response_type', 'code');
      localStorage.setItem('oauth_client_id', clientId);
      localStorage.setItem('oauth_redirect_uri', redirectUri);
      localStorage.setItem('oauth_scope', SCOPE);
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_code_challenge', codeChallenge);
      localStorage.setItem('oauth_code_challenge_method', 'S256');
      localStorage.setItem('oauth_nonce', nonce);

      oauthParams.set('response_type', 'code');
      oauthParams.set('client_id', clientId);
      oauthParams.set('redirect_uri', redirectUri);
      oauthParams.set('scope', SCOPE);
      oauthParams.set('state', state);
      oauthParams.set('code_challenge', codeChallenge);
      oauthParams.set('code_challenge_method', 'S256');
      oauthParams.set('nonce', nonce);
    } else if (!oauthParams.get('redirect_uri')) {
      oauthParams.set('redirect_uri', targetApp === 'pay' ? PAY_REDIRECT_URI : SSO_REDIRECT_URI);
    }

    if (!oauthParams.get('response_type')) {
      oauthParams.set('response_type', 'code');
    }

    if (!oauthParams.get('redirect_uri')) {
      oauthParams.set('redirect_uri', targetApp === 'pay' ? PAY_REDIRECT_URI : SSO_REDIRECT_URI);
    }

    window.location.href = `${SSO_BASE_URL}/oauth/authorize?${oauthParams.toString()}`;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setError(null);

    try {
      const response = await fetch(`${SSO_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Login failed');
      }

      if (data?.mfaRequired && data?.mfaTempToken) {
        setMfaTempToken(data.mfaTempToken);
        setTotpCode('');
        return;
      }

      await continueAfterLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login gagal. Cek email & password.');
    }
  };

  const handleMfaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();
    setError(null);

    if (!mfaTempToken) {
      setError('Sesi MFA tidak ditemukan. Silakan login ulang.');
      return;
    }

    try {
      const response = await fetch(`${SSO_BASE_URL}/auth/login/mfa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ mfaTempToken, totpCode }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.message || 'Verifikasi MFA gagal');
      }

      await continueAfterLogin();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verifikasi MFA gagal.');
    }
  };

  return (
    <div className="auth-container">
      <motion.div className="auth-card" variants={containerVariants} initial="hidden" animate="visible">
        <div className="auth-header">
          <h1>Purbalingga Akun</h1>
          <p>Masuk ke akun Anda</p>
        </div>

        {(error || localError) && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {error || localError}
          </motion.div>
        )}

        {!mfaTempToken ? (
          <form className="auth-form" onSubmit={handleFormSubmit}>
            <motion.div className="form-group" custom={0} variants={itemVariants} initial="hidden" animate="visible">
              <label htmlFor="email">Email</label>
              <input
                id="email"
                type="email"
                placeholder="nama@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
            </motion.div>

            <motion.div className="form-group" custom={1} variants={itemVariants} initial="hidden" animate="visible">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
            </motion.div>

            <motion.button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              custom={2}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              {loading ? 'Sedang masuk...' : 'Masuk'}
            </motion.button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleMfaSubmit}>
            <motion.div className="form-group" custom={0} variants={itemVariants} initial="hidden" animate="visible">
              <label htmlFor="totpCode">Kode MFA</label>
              <input
                id="totpCode"
                type="text"
                inputMode="numeric"
                placeholder="6 digit kode autentikator"
                value={totpCode}
                onChange={(e) => setTotpCode(e.target.value)}
                required
                disabled={loading}
              />
            </motion.div>

            <motion.button
              className="btn btn-primary"
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              custom={1}
              variants={itemVariants}
              initial="hidden"
              animate="visible"
            >
              {loading ? 'Memverifikasi...' : 'Verifikasi MFA'}
            </motion.button>

            <motion.button
              className="btn btn-secondary"
              type="button"
              onClick={() => {
                setMfaTempToken(null);
                setTotpCode('');
                setError(null);
              }}
              disabled={loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              Kembali
            </motion.button>
          </form>
        )}

        <motion.div className="auth-footer" custom={3} variants={itemVariants} initial="hidden" animate="visible">
          <div className="auth-footer-links">
            <a href="/forgot-password">Lupa password?</a>
            <a href="/register">Daftar di sini</a>
          </div>
          <p className="auth-footer-note">Masuk dengan email dan password akun SSO Anda.</p>
        </motion.div>
      </motion.div>
    </div>
  );
};
