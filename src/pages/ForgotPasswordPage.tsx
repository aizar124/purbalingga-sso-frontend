import React, { useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import './AuthPages.css';

export const ForgotPasswordPage: React.FC = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      await api.post('/auth/forgot-password', { email });
      setSuccess('Jika email terdaftar, link reset password akan dikirim.');
      setEmail('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal mengirim link reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="auth-header">
          <h1>Lupa Password</h1>
          <p>Masukkan email akun Anda untuk menerima link reset.</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message"><p>{success}</p></div>}

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="form-group">
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
          </div>

          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? 'Mengirim...' : 'Kirim Link Reset'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            <a href="/login">Kembali ke login</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
