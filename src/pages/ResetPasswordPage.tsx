import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import api from '../services/api';
import './AuthPages.css';

export const ResetPasswordPage: React.FC = () => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const token = useMemo(() => new URLSearchParams(window.location.search).get('token') || '', []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!token) {
      setError('Token reset tidak ditemukan. Silakan minta link baru dari halaman lupa password.');
      return;
    }

    if (newPassword.length < 8) {
      setError('Password minimal 8 karakter.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Konfirmasi password tidak cocok.');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/reset-password', {
        token,
        newPassword,
      });
      setSuccess('Password berhasil diubah. Silakan login dengan password baru Anda.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Gagal reset password.');
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
          <h1>Reset Password</h1>
          <p>Masukkan password baru untuk akun Anda.</p>
        </div>

        {error && <div className="error-message">{error}</div>}
        {success && <div className="success-message"><p>{success}</p></div>}

        {!success ? (
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="newPassword">Password Baru</label>
              <input
                id="newPassword"
                type="password"
                placeholder="••••••••"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Konfirmasi Password</label>
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Menyimpan...' : 'Ubah Password'}
            </button>
          </form>
        ) : null}

        <div className="auth-footer">
          <p>
            <a href="/login">Kembali ke login</a>
          </p>
        </div>
      </motion.div>
    </div>
  );
};
