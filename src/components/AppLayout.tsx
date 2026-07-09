'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Dashboard',
  '/agenda':        'Agenda',
  '/subscriptions': 'Clientes & Assinaturas',
  '/expenses':      'Despesas',
  '/whatsapp':      'WhatsApp',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'PA Control';

  return (
    <SidebarProvider>
      <div className="atmospheric-bg" />
      <AppSidebar />
      <SidebarInset className="bg-transparent flex w-full flex-col min-h-svh">
        {/* Topbar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 px-5 border-b border-border bg-card/90 backdrop-blur-sm shadow-[0_1px_0_var(--border)]">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
          <div className="w-px h-4 bg-border" />
          <span className="text-sm font-medium text-foreground">{title}</span>
        </header>

        {/* Content */}
        <main className="flex-1 p-6 md:p-8 overflow-x-hidden">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="w-full h-full max-w-screen-xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
