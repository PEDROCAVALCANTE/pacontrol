import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import DashboardPage from './app/(app)/dashboard/page';
import AgendaPage from './app/(app)/agenda/page';
import ClientsPage from './app/(app)/clients/page';
import ExpensesPage from './app/(app)/expenses/page';
import SubscriptionsPage from './app/(app)/subscriptions/page';
import LoginPage from './app/login/page';
import { AuthProvider } from './components/auth-provider';
import AppLayout from './app/(app)/layout';
import { TooltipProvider } from './components/ui/tooltip';
import { Toaster } from './components/ui/sonner';

export default function App() {
  return (
    <BrowserRouter>
      <TooltipProvider>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/dashboard" element={<AppLayout><DashboardPage /></AppLayout>} />
            <Route path="/agenda" element={<AppLayout><AgendaPage /></AppLayout>} />
            <Route path="/clients" element={<AppLayout><ClientsPage /></AppLayout>} />
            <Route path="/expenses" element={<AppLayout><ExpensesPage /></AppLayout>} />
            <Route path="/subscriptions" element={<AppLayout><SubscriptionsPage /></AppLayout>} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </BrowserRouter>
  );
}
