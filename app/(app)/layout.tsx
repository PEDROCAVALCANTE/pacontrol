'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="bg-transparent peer-data-[variant=inset]:min-h-svh flex w-full flex-col">
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b border-[rgba(255,255,255,0.08)] bg-[#0B0F14]/80 backdrop-blur-md px-4 lg:px-6">
          <SidebarTrigger className="text-[#9CA3AF] hover:text-[#E5E7EB]" />
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-x-hidden">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
