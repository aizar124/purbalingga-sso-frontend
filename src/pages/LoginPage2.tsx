import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import './AuthPages.css';

export const LoginPage: React.FC = () => {
  const { loginWithSSO, loading, error, clearError } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSSORedir = () => {
    clearError();
    loginWithSSO();
  };

  

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

  return (
    <div className="auth-container">
      <motion.div className="auth-card" variants={containerVariants} initial="hidden" animate="visible">
        <div className="auth-header">
          <h1>Purbalingga Akun</h1>
          <p>Masuk ke akun Anda</p>
        </div>

        {error && (
          <motion.div
            className="error-message"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {error}
          </motion.div>
        )}

        <form className="auth-form" onSubmit={(e) => e.preventDefault()}>
          <motion.div className="form-group" custom={0} variants={itemVariants} initial="hidden" animate="visible">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              placeholder="nama@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              disabled={loading}
            />
          </motion.div>

          <motion.button
            className="btn btn-primary"
            type="button"
            onClick={handleSSORedir}
            disabled={loading}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            custom={2}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? 'Sedang masuk...' : 'Masuk dengan SSO'}
          </motion.button>
        </form>

        <motion.div className="auth-footer" custom={3} variants={itemVariants} initial="hidden" animate="visible">
          <p>
            Belum punya akun?{' '}
            <a href="/register">Daftar di sini</a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
