'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <div className="flex w-full min-h-screen flex-col bg-transparent">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-slate-800/50 glass px-4 lg:px-6">
          <SidebarTrigger className="text-slate-400 hover:text-slate-100" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </div>
    </SidebarProvider>
  );
}
