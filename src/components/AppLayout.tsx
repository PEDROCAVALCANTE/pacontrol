'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { useLocation } from 'react-router-dom';
import { motion } from 'motion/react';

const PAGE_TITLES: Record<string, string> = {
  '/dashboard':     'Visão geral',
  '/agenda':        'Agenda',
  '/subscriptions': 'Assinaturas',
  '/expenses':      'Despesas',
  '/whatsapp':      'WhatsApp',
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  const title = PAGE_TITLES[pathname] ?? 'PA Control';

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex w-full flex-col min-h-svh bg-background">
        <header className="sticky top-0 z-20 flex h-[52px] items-center gap-2.5 px-4 sm:px-5
                           border-b border-border bg-background/85 backdrop-blur-md">
          <SidebarTrigger className="text-muted-foreground hover:text-foreground transition-colors" />
          <span className="text-[13px] font-medium text-foreground">{title}</span>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-8 overflow-x-hidden">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="w-full max-w-6xl mx-auto"
          >
            {children}
          </motion.div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
