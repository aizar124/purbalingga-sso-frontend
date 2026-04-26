import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import './AuthPages.css';

export const RegisterPage: React.FC = () => {
  const { register, loading, error, clearError } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: '',
    username: '',
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearError();

    try {
      await register(formData.email, formData.password, formData.name, formData.username);
      setSuccess(true);
      setFormData({ email: '', password: '', name: '', username: '' });
    } catch (err) {
      console.error(err);
    }
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

  if (success) {
    return (
      <div className="auth-container">
        <motion.div className="auth-card" variants={containerVariants} initial="hidden" animate="visible">
          <div className="success-message">
            <h2>✅ Registrasi Berhasil!</h2>
            <p>Silakan cek email Anda untuk memverifikasi akun.</p>
            <a href="/login" className="btn btn-primary">
              Kembali ke Login
            </a>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <motion.div className="auth-card" variants={containerVariants} initial="hidden" animate="visible">
        <div className="auth-header">
          <h1>Purbalingga Akun</h1>
          <p>Buat akun baru</p>
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

        <form className="auth-form" onSubmit={handleSubmit}>
          <motion.div className="form-group" custom={0} variants={itemVariants} initial="hidden" animate="visible">
            <label htmlFor="name">Nama Lengkap</label>
            <input
              id="name"
              name="name"
              type="text"
              placeholder="Nama lengkap"
              value={formData.name}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </motion.div>

          <motion.div className="form-group" custom={1} variants={itemVariants} initial="hidden" animate="visible">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              name="username"
              type="text"
              placeholder="username"
              value={formData.username}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </motion.div>

          <motion.div className="form-group" custom={2} variants={itemVariants} initial="hidden" animate="visible">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              placeholder="nama@example.com"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </motion.div>

          <motion.div className="form-group" custom={3} variants={itemVariants} initial="hidden" animate="visible">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
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
            custom={4}
            variants={itemVariants}
            initial="hidden"
            animate="visible"
          >
            {loading ? 'Sedang mendaftar...' : 'Daftar'}
          </motion.button>
        </form>

        <motion.div className="auth-footer" custom={5} variants={itemVariants} initial="hidden" animate="visible">
          <p>
            Sudah punya akun?{' '}
            <a href="/login">Masuk di sini</a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
};
