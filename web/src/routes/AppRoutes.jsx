import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import AuthGuard from '../components/auth/AuthGuard';
import AppLayout from '../components/layouts/AppLayout';
import LoveBackground from '../components/ui/LoveBackground';

// Auth Pages
import LoginPage from '../pages/auth/LoginPage';
import SignUpPage from '../pages/auth/SignUpPage';
import WelcomePage from '../pages/auth/WelcomePage';

// Main Pages
import HomePage from '../pages/HomePage';
import CouplePage from '../pages/CouplePage';
import NotesPage from '../pages/NotesPage';
import RemindersPage from '../pages/RemindersPage';
import ProfilePage from '../pages/ProfilePage';

const AppRoutes = () => {
  return (
    <AuthProvider>
      <LoveBackground>
        <Routes>
          {/* Public Routes (No Auth Required) */}
          <Route
            path="/login"
            element={
              <AuthGuard requireAuth={false}>
                <LoginPage />
              </AuthGuard>
            }
          />
          <Route
            path="/signup"
            element={
              <AuthGuard requireAuth={false}>
                <SignUpPage />
              </AuthGuard>
            }
          />
          
          {/* Welcome Route (Auth Required but no layout) */}
          <Route
            path="/welcome"
            element={
              <AuthGuard requireAuth={true}>
                <WelcomePage />
              </AuthGuard>
            }
          />

          {/* Protected Routes with Layout */}
          <Route
            path="/"
            element={
              <AuthGuard requireAuth={true}>
                <AppLayout>
                  <HomePage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/couple"
            element={
              <AuthGuard requireAuth={true}>
                <AppLayout>
                  <CouplePage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/notes"
            element={
              <AuthGuard requireAuth={true}>
                <AppLayout>
                  <NotesPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/reminders"
            element={
              <AuthGuard requireAuth={true}>
                <AppLayout>
                  <RemindersPage />
                </AppLayout>
              </AuthGuard>
            }
          />
          <Route
            path="/profile"
            element={
              <AuthGuard requireAuth={true}>
                <AppLayout>
                  <ProfilePage />
                </AppLayout>
              </AuthGuard>
            }
          />

          {/* Catch all route */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </LoveBackground>
    </AuthProvider>
  );
};

export default AppRoutes;