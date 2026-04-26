import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';

export interface User {
  id: string;
  email: string;
  name?: string;
  username?: string;
  picture?: string;
  avatarUrl?: string;
  role?: string;
  birthDate?: string;
  phone?: string;
  city?: string;
  bio?: string;
  gender?: string;
  scopes?: string[];
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  loginWithSSO: () => void;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const SSO_URL = import.meta.env.VITE_SSO_URL || 'http://localhost:4000';
  const CLIENT_ID = import.meta.env.VITE_CLIENT_ID || 'purbalingga-pay';
  const REDIRECT_URI = import.meta.env.VITE_REDIRECT_URI || 'http://localhost:5173/callback';

  // Generate random string
  const generateRandomString = (length: number) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
    let result = '';
    for (let i = 0; i < length; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  // Generate code verifier for PKCE
  const generateCodeVerifier = () => generateRandomString(128);

  // Generate code challenge from verifier (SHA256)
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

  // Login with SSO
  const loginWithSSO = useCallback(async () => {
    try {
      setError(null);
      const codeVerifier = generateCodeVerifier();
      const codeChallenge = await generateCodeChallenge(codeVerifier);
      const state = generateRandomString(32);
      const nonce = generateRandomString(32);

      // Save to localStorage (persist across page reload)
      localStorage.setItem('pkce_verifier', codeVerifier);
      localStorage.setItem('oauth_state', state);
      localStorage.setItem('oauth_nonce', nonce);
      localStorage.setItem('oauth_response_type', 'code');
      localStorage.setItem('oauth_client_id', CLIENT_ID);
      localStorage.setItem('oauth_redirect_uri', REDIRECT_URI);
      localStorage.setItem('oauth_scope', import.meta.env.VITE_SCOPE || 'openid profile email');
      localStorage.setItem('oauth_code_challenge', codeChallenge);
      localStorage.setItem('oauth_code_challenge_method', 'S256');

      console.log('OAuth params saved to localStorage');
      console.log('PKCE verifier:', codeVerifier.substring(0, 20) + '...');
      console.log('Code challenge:', codeChallenge);
      console.log('State:', state);

      const params = new URLSearchParams({
        response_type: 'code',
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
        scope: import.meta.env.VITE_SCOPE || 'openid profile email',
        state,
        code_challenge: codeChallenge,
        code_challenge_method: 'S256',
        nonce,
      });

      const authUrl = `${SSO_URL}/oauth/authorize?${params.toString()}`;
      console.log('Redirecting to:', authUrl);
      window.location.href = authUrl;
    } catch (err) {
      setError('Failed to initiate login');
      console.error(err);
    }
  }, [CLIENT_ID, REDIRECT_URI, SSO_URL]);

  // Register
  const register = useCallback(
    async (email: string, password: string, name: string, username: string) => {
      try {
        setError(null);
        await api.post('/auth/register', {
          email,
          password,
          name,
          username,
        });

        setError('Registration successful! Check your email to verify.');
      } catch (err: any) {
        setError(err.response?.data?.message || 'Registration failed');
        throw err;
      }
    },
    []
  );

  // Handle OAuth callback
  const handleCallback = useCallback(async () => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    const returnedState = params.get('state');

    console.log('Callback received');
    console.log('Code:', code);
    console.log('State:', returnedState);

    if (!code) {
      setError('No authorization code received');
      setLoading(false);
      return;
    }

    try {
      // Get stored values from localStorage
      const storedState = localStorage.getItem('oauth_state');
      const verifier = localStorage.getItem('pkce_verifier');

      console.log('Stored state:', storedState);
      console.log('Verifier exists:', !!verifier);

      if (storedState !== returnedState) {
        throw new Error('State mismatch - possible CSRF attack');
      }

      if (!verifier) {
        throw new Error('PKCE verifier not found');
      }

      console.log('Exchanging code for token...');

      const res = await api.post('/oauth/token', {
        grant_type: 'authorization_code',
        code,
        code_verifier: verifier,
        client_id: CLIENT_ID,
        redirect_uri: REDIRECT_URI,
      });

      console.log('Token received');

      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      localStorage.setItem('id_token', res.data.id_token);
      setToken(res.data.access_token);

      // Fetch user info
      console.log('Fetching user info...');
      const userRes = await api.get('/oauth/userinfo');
      console.log('User info:', userRes.data);
      setUser(userRes.data);

      // Clear OAuth params from localStorage
      localStorage.removeItem('pkce_verifier');
      localStorage.removeItem('oauth_state');
      localStorage.removeItem('oauth_nonce');
      localStorage.removeItem('oauth_response_type');
      localStorage.removeItem('oauth_client_id');
      localStorage.removeItem('oauth_redirect_uri');
      localStorage.removeItem('oauth_scope');
      localStorage.removeItem('oauth_code_challenge');
      localStorage.removeItem('oauth_code_challenge_method');

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      console.log('Login successful!');
      setTimeout(() => {
        window.location.href = '/dashboard';
      }, 1000);

    } catch (err: any) {
      console.error('Callback error:', err);
      setError(err.message || 'Failed to complete login');
    } finally {
      setLoading(false);
    }
  }, [CLIENT_ID, REDIRECT_URI]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await api.post('/oauth/logout');
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.clear();
      setUser(null);
      setToken(null);
      window.location.href = '/login';
    }
  }, []);

  // Check if already logged in
  useEffect(() => {
    const checkLogin = async () => {
      console.log('Checking login status...');
      console.log('Current path:', window.location.pathname);

      const storedToken = localStorage.getItem('access_token');

      // Check if on callback page
      if (window.location.pathname === '/callback') {
        console.log('On callback page, handling callback...');
        await handleCallback();
        return;
      }

      // Check if already have token
      if (storedToken) {
        console.log('Found stored token, fetching user info...');
        setToken(storedToken);
        try {
          const res = await api.get('/oauth/userinfo');
          console.log('User logged in:', res.data);
          setUser(res.data);
        } catch (err) {
          console.error('Token invalid, clearing...');
          localStorage.clear();
          setToken(null);
        }
      }

      setLoading(false);
    };

    checkLogin();
  }, [handleCallback]);

  const clearError = () => setError(null);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        error,
        loginWithSSO,
        register,
        logout,
        clearError,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
