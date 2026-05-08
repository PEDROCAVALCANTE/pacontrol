'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="atmospheric-bg" />
      <AppSidebar />
      <SidebarInset className="bg-transparent peer-data-[variant=inset]:min-h-svh flex w-full flex-col backdrop-blur-[2px]">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 glass-panel border-b border-r-0 border-t-0 border-l-0 px-4 lg:px-6 shadow-sm rounded-none">
          <SidebarTrigger className="text-foreground/70 hover:text-foreground transition-opacity" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
