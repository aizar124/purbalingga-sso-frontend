import React, { ChangeEvent, FormEvent, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../hooks/useAuth';
import api from '../services/api';
import './Dashboard.css';

interface Session {
  id: string;
  userAgent: string;
  ip: string;
  createdAt: string;
}

interface Consent {
  id: string;
  clientId: string;
  scopes: string[];
  grantedAt: string;
}

interface ProfileFormState {
  fullName: string;
  username: string;
  email: string;
  birthDate: string;
  phone: string;
  city: string;
  bio: string;
  gender: string;
}

const getInitials = (name?: string, email?: string) => {
  const source = name || email || 'User';
  return source
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('');
};

const formatDateTime = (value?: string) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  return date.toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });
};

const formatRelativeDays = (value?: string) => {
  if (!value) {
    return '-';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '-';
  }

  const diff = Date.now() - date.getTime();
  const days = Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)));

  if (days === 0) {
    return 'Hari ini';
  }

  if (days === 1) {
    return '1 hari lalu';
  }

  return `${days} hari lalu`;
};

const normalizeOptionalValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

export const DashboardPage: React.FC = () => {
  const { user, logout } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [consents, setConsents] = useState<Consent[]>([]);
  const [avatarPreview, setAvatarPreview] = useState<string>(user?.picture || '');
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    fullName: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    birthDate: '',
    phone: '',
    city: 'Purbalingga',
    bio: '',
    gender: '',
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  useEffect(() => {
    setAvatarPreview(user?.picture || user?.avatarUrl || '');
    setProfileForm((prev) => ({
      ...prev,
      fullName: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      birthDate: user?.birthDate || '',
      phone: user?.phone || '',
      city: user?.city || 'Purbalingga',
      bio: user?.bio || '',
      gender: user?.gender || '',
    }));
  }, [user]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [sessionsRes, consentsRes] = await Promise.all([
        api.get('/sessions'),
        api.get('/consent'),
      ]);

      setSessions(sessionsRes.data.sessions || []);
      setConsents(consentsRes.data || []);

      try {
        const profileRes = await api.get('/users/me');
        const profile = profileRes.data || {};

        setAvatarPreview(profile.avatarUrl || profile.picture || user?.picture || user?.avatarUrl || '');
        setProfileForm((prev) => ({
          ...prev,
          fullName: profile.name || user?.name || '',
          username: profile.username || user?.username || '',
          email: profile.email || user?.email || '',
          birthDate: profile.birthDate || '',
          phone: profile.phone || '',
          city: profile.city || 'Purbalingga',
          bio: profile.bio || '',
          gender: profile.gender || '',
        }));
      } catch {
        // Biarkan dashboard tetap bisa dipakai walau endpoint profil detail belum tersedia.
      }
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data dashboard');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = event.target;
    setProfileForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAvatarPreview(reader.result);
      }
    };
    reader.readAsDataURL(file);
    setSaveMessage('Foto profil baru dipilih. Tekan "Simpan perubahan" untuk menyimpan data.');
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaveMessage(null);

    const payload = {
      name: normalizeOptionalValue(profileForm.fullName),
      username: normalizeOptionalValue(profileForm.username),
      birthDate: normalizeOptionalValue(profileForm.birthDate),
      phone: normalizeOptionalValue(profileForm.phone),
      city: normalizeOptionalValue(profileForm.city),
      bio: normalizeOptionalValue(profileForm.bio),
      gender: normalizeOptionalValue(profileForm.gender),
      picture: normalizeOptionalValue(avatarPreview || user?.picture || user?.avatarUrl || ''),
      avatarUrl: normalizeOptionalValue(avatarPreview || user?.picture || user?.avatarUrl || ''),
    };

    const updateEndpoints = [
      { method: 'put' as const, url: '/users/me' },
      { method: 'patch' as const, url: '/users/me' },
      { method: 'patch' as const, url: '/profile' },
      { method: 'put' as const, url: '/account/profile' },
    ];

    try {
      let updated = false;
      let lastClientError: string | null = null;

      for (const endpoint of updateEndpoints) {
        try {
          await api[endpoint.method](endpoint.url, payload);
          updated = true;
          break;
        } catch (requestError: any) {
          if (requestError?.response?.status && requestError.response.status < 500) {
            lastClientError =
              requestError.response?.data?.message ||
              requestError.response?.data?.error ||
              requestError.message ||
              'Validasi profil gagal.';
            continue;
          }
          throw requestError;
        }
      }

      if (updated) {
        try {
          const profileRes = await api.get('/users/me');
          const profile = profileRes.data || {};

          setAvatarPreview(profile.avatarUrl || profile.picture || avatarPreview);
          setProfileForm((prev) => ({
            ...prev,
            fullName: profile.name || prev.fullName,
            username: profile.username || prev.username,
            email: profile.email || prev.email,
            birthDate: profile.birthDate || prev.birthDate,
            phone: profile.phone || prev.phone,
            city: profile.city || prev.city,
            bio: profile.bio || prev.bio,
            gender: profile.gender || prev.gender,
          }));
        } catch {
          // Tidak memblokir notifikasi sukses kalau refresh profil gagal.
        }

        setSaveMessage('Profil berhasil diperbarui.');
      } else {
        setError(lastClientError || 'Permintaan update profil ditolak server.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal menyimpan profil');
    } finally {
      setSaving(false);
    }
  };

  const handleRevokeSession = async (sessionId: string) => {
    try {
      await api.delete(`/sessions/${sessionId}`);
      setSessions((prev) => prev.filter((session) => session.id !== sessionId));
    } catch (err) {
      setError('Gagal mengakhiri sesi.');
    }
  };

  const handleRevokeConsent = async (clientId: string) => {
    try {
      await api.delete(`/consent/${clientId}`);
      setConsents((prev) => prev.filter((consent) => consent.clientId !== clientId));
    } catch (err) {
      setError('Gagal mencabut akses aplikasi.');
    }
  };

  const completionFields = [
    profileForm.fullName,
    profileForm.username,
    profileForm.email,
    profileForm.birthDate,
    profileForm.phone,
    profileForm.city,
  ];
  const completion = Math.round(
    (completionFields.filter((field) => field?.trim()).length / completionFields.length) * 100
  );

  const latestSession = sessions[0];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08, delayChildren: 0.12 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 18 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
  };

  return (
    <div className="dashboard-shell">
      <div className="dashboard-backdrop" />

      <motion.header
        className="dashboard-topbar"
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div>
          <p className="eyebrow">Purbalingga SSO</p>
          <h1>Manajemen Profil</h1>
          <p className="topbar-subtitle">Kelola identitas akun, keamanan login, dan aplikasi yang terhubung.</p>
        </div>

        <motion.button
          className="btn btn-secondary"
          onClick={logout}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.98 }}
        >
          Logout
        </motion.button>
      </motion.header>

      <motion.main
        className="dashboard-layout"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.section className="hero-panel" variants={itemVariants}>
          <div className="profile-overview">
            <div className="avatar-block">
              {avatarPreview ? (
                <img src={avatarPreview} alt="Foto profil" className="profile-avatar" />
              ) : (
                <div className="profile-avatar profile-avatar-fallback">
                  {getInitials(profileForm.fullName, profileForm.email)}
                </div>
              )}

              <div className="avatar-actions">
                <label className="btn btn-primary upload-button">
                  Ubah foto
                  <input type="file" accept="image/*" onChange={handleAvatarChange} />
                </label>
                <span>JPG atau PNG, maksimal 2 MB.</span>
              </div>
            </div>

            <div className="identity-block">
              <span className="status-pill">Akun aktif</span>
              <h2>{profileForm.fullName || user?.email || 'Pengguna SSO'}</h2>
              <p>{profileForm.email}</p>

              <div className="meta-grid">
                <div>
                  <span>Kelengkapan profil</span>
                  <strong>{completion}%</strong>
                </div>
                <div>
                  <span>Peran akun</span>
                  <strong>{user?.role || 'user'}</strong>
                </div>
                <div>
                  <span>Sesi terbaru</span>
                  <strong>{formatRelativeDays(latestSession?.createdAt)}</strong>
                </div>
              </div>

              <div className="completion-bar" aria-hidden="true">
                <span style={{ width: `${completion}%` }} />
              </div>
            </div>
          </div>

          <div className="hero-cards">
            <article className="mini-card">
              <span>Email akun</span>
              <strong>{profileForm.email || '-'}</strong>
              <p>Email dipakai untuk login dan notifikasi keamanan.</p>
            </article>
            <article className="mini-card">
              <span>Username</span>
              <strong>{profileForm.username || '-'}</strong>
              <p>Gunakan username yang mudah dikenali untuk layanan publik.</p>
            </article>
            <article className="mini-card">
              <span>Login terakhir</span>
              <strong>{formatDateTime(latestSession?.createdAt)}</strong>
              <p>Pantau aktivitas akun untuk menjaga keamanan akses.</p>
            </article>
          </div>
        </motion.section>

        {error && (
          <motion.div className="feedback feedback-error" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {error}
          </motion.div>
        )}

        {saveMessage && (
          <motion.div className="feedback feedback-success" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {saveMessage}
          </motion.div>
        )}

        <div className="dashboard-grid">
          <motion.section className="dashboard-card dashboard-card-main" variants={itemVariants}>
            <div className="section-heading">
              <div>
                <p className="eyebrow">Profil Utama</p>
                <h3>Data pribadi</h3>
              </div>
              <span className="section-badge">SSO profile</span>
            </div>

            <form className="profile-form" onSubmit={handleSaveProfile}>
              <div className="form-grid">
                <label className="field">
                  <span>Nama lengkap</span>
                  <input
                    type="text"
                    name="fullName"
                    value={profileForm.fullName}
                    onChange={handleInputChange}
                    placeholder="Masukkan nama lengkap"
                  />
                </label>

                <label className="field">
                  <span>Username</span>
                  <input
                    type="text"
                    name="username"
                    value={profileForm.username}
                    onChange={handleInputChange}
                    placeholder="Masukkan username"
                  />
                </label>

                <label className="field">
                  <span>Email</span>
                  <input type="email" name="email" value={profileForm.email} readOnly />
                </label>

                <label className="field">
                  <span>Tanggal lahir</span>
                  <input
                    type="date"
                    name="birthDate"
                    value={profileForm.birthDate}
                    onChange={handleInputChange}
                  />
                </label>

                <label className="field">
                  <span>Nomor telepon</span>
                  <input
                    type="tel"
                    name="phone"
                    value={profileForm.phone}
                    onChange={handleInputChange}
                    placeholder="08xxxxxxxxxx"
                  />
                </label>

                <label className="field">
                  <span>Jenis kelamin</span>
                  <select name="gender" value={profileForm.gender} onChange={handleInputChange}>
                    <option value="">Pilih jenis kelamin</option>
                    <option value="male">Laki-laki</option>
                    <option value="female">Perempuan</option>
                    <option value="other">Lainnya</option>
                  </select>
                </label>

                <label className="field">
                  <span>Kota / domisili</span>
                  <input
                    type="text"
                    name="city"
                    value={profileForm.city}
                    onChange={handleInputChange}
                    placeholder="Contoh: Purbalingga"
                  />
                </label>

                <div className="field field-readonly">
                  <span>Peran akun</span>
                  <div className="readonly-value">{user?.role || 'user'}</div>
                </div>
              </div>

              <label className="field field-full">
                <span>Bio singkat</span>
                <textarea
                  name="bio"
                  value={profileForm.bio}
                  onChange={handleInputChange}
                  rows={4}
                  placeholder="Tambahkan deskripsi singkat tentang akun atau instansi Anda."
                />
              </label>

              <div className="form-actions">
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Menyimpan...' : 'Simpan perubahan'}
                </button>
                <p>Perubahan utama profil sebaiknya selalu diperbarui agar data antar layanan tetap sinkron.</p>
              </div>
            </form>
          </motion.section>

          <motion.aside className="sidebar-stack" variants={itemVariants}>
            <section className="dashboard-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Keamanan</p>
                  <h3>Ringkasan akses</h3>
                </div>
              </div>

              <div className="summary-list">
                <div className="summary-item">
                  <span>Sesi aktif</span>
                  <strong>{loading ? '...' : sessions.length}</strong>
                </div>
                <div className="summary-item">
                  <span>Aplikasi terhubung</span>
                  <strong>{loading ? '...' : consents.length}</strong>
                </div>
                <div className="summary-item">
                  <span>Status akun</span>
                  <strong>Terproteksi</strong>
                </div>
              </div>
            </section>

            <section className="dashboard-card">
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Preferensi</p>
                  <h3>Panduan singkat</h3>
                </div>
              </div>

              <div className="tips-list">
                <div>
                  <strong>Lengkapi identitas</strong>
                  <p>Nama, tanggal lahir, dan nomor telepon akan memudahkan verifikasi lintas layanan.</p>
                </div>
                <div>
                  <strong>Gunakan foto resmi</strong>
                  <p>Foto profil yang jelas membantu pengenalan akun pada dashboard layanan pemerintah.</p>
                </div>
                <div>
                  <strong>Tinjau akses aplikasi</strong>
                  <p>Cabut izin aplikasi yang sudah tidak digunakan untuk mengurangi risiko penyalahgunaan.</p>
                </div>
              </div>
            </section>
          </motion.aside>
        </div>

        {!loading && (
          <>
            <motion.section className="dashboard-card" variants={itemVariants}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Keamanan Login</p>
                  <h3>Sesi aktif</h3>
                </div>
                <span className="section-badge">{sessions.length} perangkat</span>
              </div>

              {sessions.length === 0 ? (
                <p className="empty-state">Belum ada sesi aktif lain yang tercatat.</p>
              ) : (
                <div className="stack-list">
                  {sessions.map((session) => (
                    <motion.div
                      key={session.id}
                      className="stack-item"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div>
                        <strong>{session.userAgent || 'Perangkat tidak dikenali'}</strong>
                        <p>IP {session.ip || '-'} • {formatDateTime(session.createdAt)}</p>
                      </div>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRevokeSession(session.id)}
                      >
                        Akhiri sesi
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>

            <motion.section className="dashboard-card" variants={itemVariants}>
              <div className="section-heading">
                <div>
                  <p className="eyebrow">Akses Aplikasi</p>
                  <h3>Aplikasi terhubung</h3>
                </div>
                <span className="section-badge">{consents.length} izin aktif</span>
              </div>

              {consents.length === 0 ? (
                <p className="empty-state">Belum ada aplikasi yang terhubung ke akun ini.</p>
              ) : (
                <div className="stack-list">
                  {consents.map((consent) => (
                    <motion.div
                      key={consent.id || consent.clientId}
                      className="stack-item"
                      initial={{ opacity: 0, x: -12 }}
                      animate={{ opacity: 1, x: 0 }}
                    >
                      <div>
                        <strong>{consent.clientId}</strong>
                        <p>Izin: {consent.scopes?.join(', ') || 'profile, email'}</p>
                        <p>Diberikan: {formatDateTime(consent.grantedAt)}</p>
                      </div>

                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleRevokeConsent(consent.clientId)}
                      >
                        Cabut akses
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </motion.section>
          </>
        )}
      </motion.main>
    </div>
  );
};
