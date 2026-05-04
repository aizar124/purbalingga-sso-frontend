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
  isCurrent?: boolean;
  deviceName?: string;
  browser?: string;
  platform?: string;
  location?: string;
  lastUsedAt?: string;
  updatedAt?: string;
  loginAt?: string;
  created_at?: string;
  last_used_at?: string;
  updated_at?: string;
  login_at?: string;
}

interface Consent {
  id: string;
  clientId: string;
  clientName?: string;
  scopes: string[];
  grantedAt: string;
  createdAt?: string;
  updatedAt?: string;
  created_at?: string;
  updated_at?: string;
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

const normalizeOptionalValue = (value: string) => {
  const trimmed = value.trim();
  return trimmed === '' ? undefined : trimmed;
};

const extractArrayPayload = (payload: unknown, primaryKeys: string[]): unknown[] => {
  if (Array.isArray(payload)) {
    return payload;
  }

  if (!payload || typeof payload !== 'object') {
    return [];
  }

  const record = payload as Record<string, unknown>;

  for (const key of primaryKeys) {
    const value = record[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  const nested = record.data;
  if (Array.isArray(nested)) {
    return nested;
  }

  if (nested && typeof nested === 'object') {
    const nestedRecord = nested as Record<string, unknown>;
    for (const key of primaryKeys) {
      const value = nestedRecord[key];
      if (Array.isArray(value)) {
        return value;
      }
    }

    if (Array.isArray(nestedRecord.items)) {
      return nestedRecord.items;
    }

    if (Array.isArray(nestedRecord.results)) {
      return nestedRecord.results;
    }
  }

  if (Array.isArray(record.items)) {
    return record.items;
  }

  if (Array.isArray(record.results)) {
    return record.results;
  }

  return [];
};

const pickTimestamp = (session?: Session | null) =>
  session?.lastUsedAt ||
  session?.updatedAt ||
  session?.loginAt ||
  session?.last_used_at ||
  session?.updated_at ||
  session?.login_at ||
  session?.createdAt ||
  session?.created_at ||
  '';

const describeSession = (session: Session) => {
  const ua = session.userAgent || '';
  const browser =
    session.browser ||
    (ua.includes('Chrome')
      ? 'Chrome'
      : ua.includes('Firefox')
        ? 'Firefox'
        : ua.includes('Safari') && !ua.includes('Chrome')
          ? 'Safari'
          : ua.includes('Edg')
            ? 'Edge'
            : undefined);
  const platform =
    session.platform ||
    (ua.includes('Windows')
      ? 'Windows'
      : ua.includes('Mac OS') || ua.includes('Macintosh')
        ? 'macOS'
        : ua.includes('Android')
          ? 'Android'
          : ua.includes('iPhone') || ua.includes('iPad')
            ? 'iOS'
            : ua.includes('Linux')
              ? 'Linux'
              : undefined);

  return {
    browser: browser || 'Browser tidak dikenali',
    platform: platform || 'Platform tidak dikenali',
  };
};

const normalizeSessions = (payload: unknown): Session[] => {
  const rawSessions = extractArrayPayload(payload, ['sessions', 'activeSessions', 'sessionList']);

  return rawSessions
    .map((item, index) => {
      const session = item as Record<string, unknown>;
      const createdAt =
        typeof session.createdAt === 'string'
          ? session.createdAt
          : typeof session.created_at === 'string'
            ? session.created_at
            : '';

      return {
        id: String(session.id || session.sessionId || session.sid || createdAt || `session-${index}`),
        userAgent: String(session.userAgent || session.user_agent || session.device || ''),
        ip: String(session.ip || session.ipAddress || session.ip_address || ''),
        createdAt,
        isCurrent:
          typeof session.isCurrent === 'boolean'
            ? session.isCurrent
            : typeof session.current === 'boolean'
              ? session.current
              : typeof session.active === 'boolean'
                ? session.active
                : undefined,
        deviceName: typeof session.deviceName === 'string' ? session.deviceName : undefined,
        browser: typeof session.browser === 'string' ? session.browser : undefined,
        platform: typeof session.platform === 'string' ? session.platform : undefined,
        location: typeof session.location === 'string' ? session.location : undefined,
        lastUsedAt: typeof session.lastUsedAt === 'string' ? session.lastUsedAt : undefined,
        updatedAt: typeof session.updatedAt === 'string' ? session.updatedAt : undefined,
        loginAt: typeof session.loginAt === 'string' ? session.loginAt : undefined,
        created_at: typeof session.created_at === 'string' ? session.created_at : undefined,
        last_used_at: typeof session.last_used_at === 'string' ? session.last_used_at : undefined,
        updated_at: typeof session.updated_at === 'string' ? session.updated_at : undefined,
        login_at: typeof session.login_at === 'string' ? session.login_at : undefined,
      } as Session;
    })
    .sort((a, b) => new Date(pickTimestamp(b)).getTime() - new Date(pickTimestamp(a)).getTime());
};

const normalizeConsents = (payload: unknown): Consent[] => {
  const rawConsents = extractArrayPayload(payload, ['consents', 'consent', 'authorizedApps', 'apps']);

  return rawConsents.map((item) => {
    const consent = item as Record<string, unknown>;
    const clientId = String(consent.clientId || consent.client_id || consent.client || '');

    return {
      id: String(consent.id || consent.consentId || consent.clientId || consent.client_id || clientId),
      clientId,
      clientName: typeof consent.clientName === 'string' ? consent.clientName : typeof consent.name === 'string' ? consent.name : undefined,
      scopes: Array.isArray(consent.scopes)
        ? consent.scopes.map((scope) => String(scope)).filter(Boolean)
        : typeof consent.scope === 'string'
          ? consent.scope.split(' ').map((scope) => scope.trim()).filter(Boolean)
          : [],
      grantedAt:
        typeof consent.grantedAt === 'string'
          ? consent.grantedAt
          : typeof consent.createdAt === 'string'
            ? consent.createdAt
            : typeof consent.created_at === 'string'
              ? consent.created_at
              : typeof consent.updatedAt === 'string'
                ? consent.updatedAt
                : typeof consent.updated_at === 'string'
                  ? consent.updated_at
                  : '',
      createdAt: typeof consent.createdAt === 'string' ? consent.createdAt : undefined,
      updatedAt: typeof consent.updatedAt === 'string' ? consent.updatedAt : undefined,
      created_at: typeof consent.created_at === 'string' ? consent.created_at : undefined,
      updated_at: typeof consent.updated_at === 'string' ? consent.updated_at : undefined,
    };
  });
};

export const DashboardPage: React.FC = () => {
  const { user, logout, returnToPayHome, canReturnToPayHome, returnToSmartCityHome, canReturnToSmartCityHome } = useAuth();
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
  }, [user?.id]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      setSessions([]);
      setConsents([]);

      const [sessionsRes, consentsRes] = await Promise.allSettled([
        api.get('/sessions'),
        api.get('/consent'),
      ]);

      if (sessionsRes.status === 'fulfilled') {
        setSessions(normalizeSessions(sessionsRes.value.data));
      }

      if (consentsRes.status === 'fulfilled') {
        setConsents(normalizeConsents(consentsRes.value.data));
      }

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
  const resolvedLastLoginAt = user?.lastLoginAt || latestSession?.createdAt || latestSession?.loginAt || latestSession?.updatedAt;
  const currentSession = sessions.find((session) => session.isCurrent) || latestSession;

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

        <div className="topbar-actions">
          {canReturnToSmartCityHome && (
            <motion.button
              className="btn btn-primary"
              onClick={returnToSmartCityHome}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Kembali ke Smart City
            </motion.button>
          )}

          {canReturnToPayHome && (
            <motion.button
              className="btn btn-primary"
              onClick={returnToPayHome}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
            >
              Kembali ke Purbalingga Pay
            </motion.button>
          )}

          <motion.button
            className="btn btn-secondary"
            onClick={logout}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            Logout
          </motion.button>
        </div>
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
                  <span>Login terakhir</span>
                  <strong>{formatDateTime(resolvedLastLoginAt)}</strong>
                </div>
                <div>
                  <span>Sesi ini</span>
                  <strong>{currentSession ? describeSession(currentSession).browser : '-'}</strong>
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
              <span>Sesi terbaru</span>
              <strong>{formatDateTime(latestSession?.createdAt || pickTimestamp(latestSession))}</strong>
              <p>Sesi paling baru menjadi referensi untuk aktivitas login terakhir di dashboard ini.</p>
            </article>
            <article className="mini-card">
              <span>Sesi aktif saat ini</span>
              <strong>{currentSession ? describeSession(currentSession).platform : '-'}</strong>
              <p>{currentSession?.location || 'Lokasi sesi tidak tersedia dari backend.'}</p>
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
                  <span>Login terakhir</span>
                  <strong>{loading ? '...' : formatDateTime(resolvedLastLoginAt)}</strong>
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
                        <div className="stack-heading">
                          <strong>{session.deviceName || describeSession(session).browser}</strong>
                          {session.isCurrent && <span className="session-tag session-tag-current">Sesi ini</span>}
                          {!session.isCurrent && session === latestSession && (
                            <span className="session-tag session-tag-latest">Terbaru</span>
                          )}
                        </div>
                        <p>{describeSession(session).platform} • {session.location || 'Lokasi tidak tersedia'}</p>
                        <p>IP {session.ip || '-'} • Login {formatDateTime(session.createdAt)}</p>
                        <p className="session-user-agent">{session.userAgent || 'Perangkat tidak dikenali'}</p>
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
                        <div className="stack-heading">
                          <strong>{consent.clientName || consent.clientId}</strong>
                          <span className="session-tag">Terkoneksi</span>
                        </div>
                        <p>ID aplikasi: {consent.clientId}</p>
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
