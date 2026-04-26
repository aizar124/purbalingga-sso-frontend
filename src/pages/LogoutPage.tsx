import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export const LogoutPage: React.FC = () => {
  const { logout } = useAuth();
  const [message, setMessage] = useState<string | null>('Membersihkan sesi SSO...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const performLogout = async () => {
      try {
        await logout();
      } catch (err: any) {
        if (cancelled) {
          return;
        }
        setError(err?.message || 'Logout gagal.');
        setMessage(null);
        return;
      }
    };

    performLogout();

    return () => {
      cancelled = true;
    };
  }, [logout]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        backgroundColor: 'var(--background)',
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.35 }}
        style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'var(--surface)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          maxWidth: '420px',
          width: '100%',
        }}
      >
        <h2>{error ? 'Logout gagal' : 'Sedang logout...'}</h2>
        {error ? (
          <>
            <p style={{ color: 'var(--danger)' }}>{error}</p>
            <a
              href="/login"
              style={{
                display: 'inline-block',
                marginTop: '1rem',
                padding: '0.5rem 1rem',
                backgroundColor: 'var(--accent)',
                color: 'white',
                borderRadius: '4px',
                textDecoration: 'none',
              }}
            >
              Kembali ke Login
            </a>
          </>
        ) : (
          <p style={{ color: 'var(--muted)' }}>{message}</p>
        )}
      </motion.div>
    </div>
  );
};
