import React, { createContext, useState, useEffect, useCallback } from 'react';
import api from '../services/api';
import {
  PAY_HOME_URL,
  SMARTCITY_HOME_URL,
  SSO_REDIRECT_URI,
} from '../config/sso';

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
  canReturnToPayHome: boolean;
  returnToPayHome: () => void;
  canReturnToSmartCityHome: boolean;
  returnToSmartCityHome: () => void;
  register: (email: string, password: string, name: string, username: string) => Promise<void>;
  logout: () => Promise<void>;
  clearError: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getBootstrapSsoAccessToken = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  const params = new URLSearchParams(window.location.search);
  return params.get('sso_access_token') || params.get('token') || params.get('auth_token');
};

const getBootstrapSessionSource = (): 'sso' | 'pay' | 'smartcity' | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const source = new URLSearchParams(window.location.search).get('source');
  if (source === 'pay' || source === 'sso' || source === 'smartcity') {
    return source;
  }

  return null;
};

const SESSION_ORIGIN_KEY = 'auth_session_origin';
const getStoredSessionOrigin = (): 'sso' | 'pay' | 'smartcity' | null => {
  if (typeof window === 'undefined') {
    return null;
  }

  const value = localStorage.getItem(SESSION_ORIGIN_KEY);
  return value === 'pay' || value === 'sso' || value === 'smartcity' ? value : null;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(
    Boolean(localStorage.getItem('access_token')) || Boolean(getBootstrapSsoAccessToken())
  );
  const [error, setError] = useState<string | null>(null);
  const [sessionOrigin, setSessionOrigin] = useState<'sso' | 'pay' | 'smartcity' | null>(getStoredSessionOrigin());

  const SSO_CLIENT_ID = import.meta.env.VITE_SSO_CLIENT_ID || 'purbalingga-sso';

  const returnToPayHome = useCallback(() => {
    try {
      if (!PAY_HOME_URL) {
        throw new Error('URL utama Purbalingga Pay belum dikonfigurasi.');
      }

      const currentToken = token || localStorage.getItem('access_token');
      const returnUrl = new URL(PAY_HOME_URL);

      if (currentToken) {
        returnUrl.searchParams.set('sso_access_token', currentToken);
      }

      window.location.href = returnUrl.toString();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal kembali ke Purbalingga Pay');
      console.error(err);
    }
  }, [PAY_HOME_URL, token]);

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
        client_id: SSO_CLIENT_ID,
        redirect_uri: SSO_REDIRECT_URI,
      });

      console.log('Token received');

      localStorage.setItem('access_token', res.data.access_token);
      localStorage.setItem('refresh_token', res.data.refresh_token);
      localStorage.setItem('id_token', res.data.id_token);
      setToken(res.data.access_token);
      setSessionOrigin((localStorage.getItem(SESSION_ORIGIN_KEY) as 'sso' | 'pay' | 'smartcity' | null) || 'sso');

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
  }, [SSO_CLIENT_ID, SSO_REDIRECT_URI]);

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
      setSessionOrigin(null);
      window.location.href = '/login';
    }
  }, []);

  // Check if already logged in
  useEffect(() => {
    const checkLogin = async () => {
      console.log('Checking login status...');
      console.log('Current path:', window.location.pathname);

      const bootstrapToken = getBootstrapSsoAccessToken();
      const bootstrapSource = getBootstrapSessionSource();
      const storedToken = localStorage.getItem('access_token');

      if (bootstrapToken) {
        console.log('Found bootstrap token from external app, hydrating SSO session...');
        localStorage.setItem('access_token', bootstrapToken);
        const bootstrapOrigin = bootstrapSource || (new URLSearchParams(window.location.search).has('sso_access_token') ? 'pay' : 'smartcity');
        localStorage.setItem(SESSION_ORIGIN_KEY, bootstrapOrigin);
        setToken(bootstrapToken);
        setSessionOrigin(bootstrapOrigin);

        try {
          const res = await api.get('/oauth/userinfo');
          console.log('Bootstrap user logged in:', res.data);
          setUser(res.data);
        } catch (err) {
          console.error('Bootstrap token invalid, clearing...');
          localStorage.clear();
          setToken(null);
          setUser(null);
          setSessionOrigin(null);
        } finally {
          window.history.replaceState({}, document.title, window.location.pathname);
          setLoading(false);
        }

        return;
      }

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
        setSessionOrigin((getStoredSessionOrigin() as 'sso' | 'pay' | 'smartcity' | null) || 'sso');
        try {
          const res = await api.get('/oauth/userinfo');
          console.log('User logged in:', res.data);
          setUser(res.data);
        } catch (err) {
          console.error('Token invalid, clearing...');
          localStorage.clear();
          setToken(null);
          setSessionOrigin(null);
        }
      }

      setLoading(false);
    };

    checkLogin();
  }, [handleCallback]);

  const clearError = () => setError(null);
  const bootstrapSource = getBootstrapSessionSource();
  const canReturnToSmartCityHome = sessionOrigin === 'smartcity' || bootstrapSource === 'smartcity';

  const returnToSmartCityHome = useCallback(() => {
    try {
      if (!SMARTCITY_HOME_URL) {
        throw new Error('URL utama Smart City belum dikonfigurasi.');
      }

      window.location.href = SMARTCITY_HOME_URL;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal kembali ke Smart City');
      console.error(err);
    }
  }, [SMARTCITY_HOME_URL]);

  return (
    <AuthContext.Provider
      value={{
      user,
      token,
      loading,
      error,
      canReturnToPayHome: sessionOrigin === 'pay',
      canReturnToSmartCityHome,
      register,
        logout,
        clearError,
        returnToPayHome,
        returnToSmartCityHome,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
