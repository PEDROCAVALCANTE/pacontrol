import type {Metadata} from 'next';
import './globals.css';
import { Inter } from "next/font/google";
import { cn } from "@/lib/utils";
import { AuthProvider } from '@/components/auth-provider';
import { Toaster } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';

const inter = Inter({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'PA Control',
  description: 'Sistema SaaS para gerenciamento financeiro de clientes',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="pt-BR" className={cn("font-sans dark", inter.variable)}>
      <body suppressHydrationWarning className="bg-[#101114] text-slate-50 min-h-screen selection:bg-amber-500/30">
        <TooltipProvider>
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </TooltipProvider>
      </body>
    </html>
  );
}
