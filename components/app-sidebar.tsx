'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { 
  LayoutDashboard, 
  Users, 
  CreditCard, 
  Receipt,
  Settings,
  LogOut,
  Layers
} from 'lucide-react';
import { 
  Sidebar, 
  SidebarContent, 
  SidebarFooter, 
  SidebarGroup, 
  SidebarGroupContent, 
  SidebarGroupLabel, 
  SidebarHeader, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem, 
} from '@/components/ui/sidebar';
import { useAuth } from './auth-provider';

export function AppSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();

  const navItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, iconColor: 'text-indigo-400', activeBg: 'bg-indigo-500/10', activeText: 'text-indigo-400' },
    { title: 'Assinaturas', url: '/subscriptions', icon: CreditCard, iconColor: 'text-emerald-400', activeBg: 'bg-emerald-500/10', activeText: 'text-emerald-400' },
    { title: 'Despesas', url: '/expenses', icon: Receipt, iconColor: 'text-amber-400', activeBg: 'bg-amber-500/10', activeText: 'text-amber-400' },
  ];

  return (
    <Sidebar className="border-r border-slate-800 glass text-slate-400">
      <SidebarHeader className="border-b px-6 py-6 border-slate-800/50">
        <div className="flex justify-center items-center">
          <div className="w-32 h-12 relative flex items-center justify-center">
            <Image 
              src="https://iili.io/Bs2OL4s.png" 
              alt="PA Control" 
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent className="px-2 pt-4">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive} 
                      tooltip={item.title} 
                      className={`sidebar-link px-3 py-5 rounded-lg text-slate-400 font-medium ${isActive ? `${item.activeBg} ${item.activeText}` : 'hover:bg-slate-800/50'}`}
                      render={<Link href={item.url} />}
                    >
                        <item.icon className={`w-5 h-5 mr-3 ${item.iconColor}`} />
                        <span className="text-base">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-slate-800/50 p-4">
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-4 text-center">
          <p className="text-sm font-medium text-white">Pedro & Angra</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors py-4 px-3 rounded-lg">
              <LogOut className="w-5 h-5 mr-3" />
              <span className="text-base">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
