import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { CallbackPage } from './pages/CallbackPage';
import { DashboardPage } from './pages/DashboardPage';
import { LogoutPage } from './pages/LogoutPage';
import './styles/globals.css';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const authContext = React.useContext(AuthContext);
  
  if (!authContext) {
    return <div>Loading...</div>;
  }

  const { user, loading, token } = authContext;

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
      }}>
        <p>Loading...</p>
      </div>
    );
  }

  if (!token || !user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/callback" element={<CallbackPage />} />
          <Route path="/logout" element={<LogoutPage />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
};

export default App;
