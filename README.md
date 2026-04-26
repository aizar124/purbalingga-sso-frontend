# FASE 3 — Frontend SSO (React + Vite)

Frontend untuk Purbalingga Akun SSO.

## 🚀 Setup Cepat

```bash
npm install
cp .env.example .env
npm run dev
```

Server berjalan di `http://localhost:5174`

---

## 📁 Struktur Folder

```
src/
├── pages/             # Page components
│   ├── LoginPage.tsx
│   ├── RegisterPage.tsx
│   ├── CallbackPage.tsx
│   ├── DashboardPage.tsx
│   ├── AuthPages.css
│   └── Dashboard.css
├── context/           # React Context
│   └── AuthContext.tsx
├── hooks/             # Custom hooks
│   └── useAuth.ts
├── services/          # API services
│   └── api.ts
├── styles/            # Global styles
│   └── globals.css
├── App.tsx           # Root component
└── main.tsx          # Entry point
```

---

## 🔧 Environment Variables

Edit `.env`:

```env
VITE_SSO_URL=http://localhost:4000
VITE_CLIENT_ID=purbalingga-pay
VITE_REDIRECT_URI=http://localhost:5173/callback
VITE_SCOPE=openid profile email
```

---

## 📄 Pages

### LoginPage (`/login`)
- User dapat login dengan SSO
- Redirect ke backend SSO untuk OAuth flow

### RegisterPage (`/register`)
- User dapat mendaftar akun baru
- Email verification diperlukan

### CallbackPage (`/callback`)
- Halaman callback dari SSO
- Menerima authorization code
- Exchange code dengan token

### DashboardPage (`/dashboard`)
- Protected route (memerlukan login)
- Tampilkan profil user
- Manage active sessions
- Revoke app consents

---

## 🔐 Authentication Flow

1. User klik "Login dengan SSO" → redirect ke SSO
2. Backend SSO handle login → return authorization code
3. Frontend exchange code dengan token (PKCE)
4. Store token di localStorage
5. Fetch user info dari `/oauth/userinfo`
6. Redirect ke dashboard

---

## 🛠️ Components

### AuthContext
- `user` — user profile
- `token` — access token
- `loading` — loading state
- `error` — error message
- `loginWithSSO()` — redirect ke SSO
- `register()` — register baru
- `logout()` — logout
- `clearError()` — clear error

### useAuth Hook
```typescript
const { user, token, loading, error, loginWithSSO, logout } = useAuth();
```

### API Service
- Auto add authorization header
- Auto refresh token saat 401
- Base URL dari .env

---

## 🚦 Protected Routes

Dashboard page dilindungi dengan `ProtectedRoute`:
- Check apakah user login
- Redirect ke login kalau belum
- Show loading saat checking

---

## 🎨 Styling

- CSS Variables untuk theming
- Tailwind-like utility classes
- Responsive design
- Dark mode ready

---

## 📦 Dependencies

- react ^18.2.0
- react-router-dom ^6.20.0
- axios ^1.6.0
- framer-motion ^10.16.0

---

## 🔗 Backend Requirements

Backend SSO harus berjalan di `http://localhost:4000` dengan:
- `/oauth/authorize` endpoint
- `/oauth/token` endpoint
- `/oauth/userinfo` endpoint
- `/oauth/logout` endpoint
- `/sessions` endpoint
- `/consent` endpoint

---

## 📝 Notes

- Token disimpan di localStorage (development)
- PKCE (code challenge/verifier) untuk security
- Auto refresh token saat expired
- State validation untuk CSRF protection

---

**Fase 3 selesai! Siap untuk Fase 4 (Laravel Integration).** 🚀
