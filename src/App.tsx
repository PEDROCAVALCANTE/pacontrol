import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './pages/Dashboard';
import AgendaPage from './pages/Agenda';
import ExpensesPage from './pages/Expenses';
import SubscriptionsPage from './pages/Subscriptions';
import LoginPage from './pages/Login';
import { AuthProvider } from './components/auth-provider';
import AppLayout from './components/AppLayout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';
import { ThemeProvider } from './components/theme-provider';

export default function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="vite-ui-theme">
      <BrowserRouter>
        <TooltipProvider>
          <AuthProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
              <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
              <Route path="/agenda" element={<AppLayout><AgendaPage /></AppLayout>} />
              <Route path="/subscriptions" element={<AppLayout><SubscriptionsPage /></AppLayout>} />
              <Route path="/expenses" element={<AppLayout><ExpensesPage /></AppLayout>} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
            <Toaster position="top-right" expand={true} richColors />
          </AuthProvider>
        </TooltipProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
