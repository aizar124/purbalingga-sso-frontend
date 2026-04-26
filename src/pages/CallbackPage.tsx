import React from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';

export const CallbackPage: React.FC = () => {
  const { loading, error } = useAuth();

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      backgroundColor: 'var(--background)',
    }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        style={{
          textAlign: 'center',
          padding: '2rem',
          backgroundColor: 'var(--surface)',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
        }}
      >
        {loading && (
          <>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{
                width: '48px',
                height: '48px',
                border: '4px solid var(--accent-light)',
                borderTop: '4px solid var(--accent)',
                borderRadius: '50%',
                margin: '0 auto 1rem',
              }}
            />
            <h2>Sedang memproses login...</h2>
            <p style={{ color: 'var(--muted)' }}>Tunggu sebentar, Anda akan segera dialihkan.</p>
          </>
        )}

        {error && (
          <>
            <h2 style={{ color: 'var(--danger)' }}>❌ Login Gagal</h2>
            <p>{error}</p>
            <a href="/login" style={{
              display: 'inline-block',
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: 'var(--accent)',
              color: 'white',
              borderRadius: '4px',
              textDecoration: 'none',
            }}>
              Kembali ke Login
            </a>
          </>
        )}
      </motion.div>
    </div>
  );
};
