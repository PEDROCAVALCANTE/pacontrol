'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
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
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard },
    { title: 'Clientes', url: '/clients', icon: Users },
    { title: 'Assinaturas', url: '/subscriptions', icon: CreditCard },
    { title: 'Despesas', url: '/expenses', icon: Receipt },
  ];

  return (
    <Sidebar className="border-r border-slate-800 glass text-slate-400">
      <SidebarHeader className="border-b px-6 py-6 border-slate-800/50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center font-bold text-white">
            PA
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">PA Control</h1>
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
                      className={`sidebar-link px-3 py-5 rounded-lg text-slate-400 font-medium ${isActive ? 'bg-indigo-500/10 text-indigo-400' : ''}`}
                      render={<Link href={item.url} />}
                    >
                        <item.icon className="w-5 h-5 mr-3" />
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
        <div className="p-4 bg-slate-800/50 rounded-xl border border-slate-700/50 mb-4">
          <p className="text-xs text-slate-400 mb-1 uppercase tracking-wider">Usuário</p>
          <p className="text-sm font-medium text-white">financeiro@empresa.com</p>
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
