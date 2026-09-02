import React, { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MotionConfig } from 'framer-motion';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import { MainLayout } from './components/layout/MainLayout';
import { PageLoader } from './components/common/PageLoader';

// Every route is a separate chunk, so the first paint no longer has to download the
// charting and form code of pages the user may never open.
const Login = lazy(() => import('./pages/Login').then((m) => ({ default: m.Login })));
const Register = lazy(() => import('./pages/Register').then((m) => ({ default: m.Register })));
const Dashboard = lazy(() => import('./pages/Dashboard').then((m) => ({ default: m.Dashboard })));
const Incomes = lazy(() => import('./pages/Incomes').then((m) => ({ default: m.Incomes })));
const Expenses = lazy(() => import('./pages/Expenses').then((m) => ({ default: m.Expenses })));
const Budgets = lazy(() => import('./pages/Budgets').then((m) => ({ default: m.Budgets })));
const Goals = lazy(() => import('./pages/Goals').then((m) => ({ default: m.Goals })));
const Calendar = lazy(() => import('./pages/Calendar').then((m) => ({ default: m.Calendar })));
const Statistics = lazy(() => import('./pages/Statistics').then((m) => ({ default: m.Statistics })));
const Profile = lazy(() => import('./pages/Profile').then((m) => ({ default: m.Profile })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 1000 * 60 * 5, // 5 mins
      retry: 1,
      // With the default 'online' mode a failed read is *paused* rather than failed
      // whenever React Query believes the browser is offline. The query then sits in
      // `pending` indefinitely, so the pages render their "nothing here yet" state over
      // data that never arrived and no error is ever reported. 'always' lets the failure
      // become a real error the UI can show.
      networkMode: 'always',
    },
    mutations: {
      networkMode: 'always',
    },
  },
});

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader fullscreen />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader fullscreen showLabel={false} />;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <MotionConfig reducedMotion="user">
      <AuthProvider>
        <ThemeProvider>
          <DataProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader fullscreen />}>
                <Routes>
                {/* Public Auth Routes */}
                <Route
                  path="/login"
                  element={
                    <PublicRoute>
                      <Login />
                    </PublicRoute>
                  }
                />
                <Route
                  path="/register"
                  element={
                    <PublicRoute>
                      <Register />
                    </PublicRoute>
                  }
                />

                {/* Protected App Routes */}
                <Route
                  path="/"
                  element={
                    <ProtectedRoute>
                      <MainLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route index element={<Dashboard />} />
                  <Route path="incomes" element={<Incomes />} />
                  <Route path="expenses" element={<Expenses />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="goals" element={<Goals />} />
                  <Route path="calendar" element={<Calendar />} />
                  <Route path="statistics" element={<Statistics />} />
                  <Route path="profile" element={<Profile />} />
                </Route>

                {/* Catch-all fallback */}
                <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </DataProvider>
        </ThemeProvider>
      </AuthProvider>
      </MotionConfig>
    </QueryClientProvider>
  );
};

export default App;
