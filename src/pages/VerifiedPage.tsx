import React from 'react';
import { motion } from 'framer-motion';

export const VerifiedPage: React.FC = () => {
  return (
    <div className="auth-container">
      <motion.div
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        <div className="success-message">
          <h2>✅ Email berhasil diverifikasi</h2>
          <p>Akun Anda sudah aktif. Silakan login untuk melanjutkan.</p>
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="/login" className="btn btn-primary">
              Ke Login
            </a>
            <a href="/dashboard" className="btn btn-secondary">
              Buka Dashboard
            </a>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
