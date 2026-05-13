'use client';
import { AppSidebar } from '@/components/app-sidebar';
import { SidebarProvider, SidebarTrigger, SidebarInset } from '@/components/ui/sidebar';
import { Sun, Moon, Sunrise } from 'lucide-react';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';

function Greeting() {
  const [greeting, setGreeting] = useState('');
  const [Icon, setIcon] = useState<any>(null);

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) {
      setGreeting('Bom dia');
      setIcon(() => Sunrise);
    } else if (hour >= 12 && hour < 18) {
      setGreeting('Boa tarde');
      setIcon(() => Sun);
    } else {
      setGreeting('Boa noite');
      setIcon(() => Moon);
    }
  }, []);

  if (!greeting || !Icon) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, x: -10 }} 
      animate={{ opacity: 1, x: 0 }} 
      transition={{ delay: 0.2 }}
      className="flex items-center gap-2 text-foreground/80 font-medium ml-4"
    >
      <Icon className="w-5 h-5 text-amber-500" />
      <span>{greeting}, Pedro e Angra!</span>
    </motion.div>
  );
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider>
      <div className="atmospheric-bg" />
      <AppSidebar />
      <SidebarInset className="bg-transparent peer-data-[variant=inset]:min-h-svh flex w-full flex-col backdrop-blur-[2px]">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 glass-panel px-4 lg:px-6 shadow-sm rounded-none">
          <SidebarTrigger className="text-foreground/70 hover:text-foreground transition-opacity" />
          <Greeting />
          <div className="flex-1" />
        </header>
        <main className="flex-1 p-6 sm:p-8 lg:p-10 overflow-x-hidden">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="w-full h-full"
          >
            {children}
          </motion.div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
