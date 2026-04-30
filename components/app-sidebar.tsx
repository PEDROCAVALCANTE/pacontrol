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
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, iconColor: 'group-[[data-active=true]]:text-[#3B82F6] text-[#9CA3AF] group-hover:text-[#3B82F6]', activeBg: 'data-[active=true]:bg-[#3B82F6]/10', activeText: 'data-[active=true]:text-[#3B82F6]' },
    { title: 'Assinaturas', url: '/subscriptions', icon: CreditCard, iconColor: 'group-[[data-active=true]]:text-[#8B5CF6] text-[#9CA3AF] group-hover:text-[#8B5CF6]', activeBg: 'data-[active=true]:bg-[#8B5CF6]/10', activeText: 'data-[active=true]:text-[#8B5CF6]' },
    { title: 'Despesas', url: '/expenses', icon: Receipt, iconColor: 'group-[[data-active=true]]:text-[#FF6A00] text-[#9CA3AF] group-hover:text-[#FF6A00]', activeBg: 'data-[active=true]:bg-[#FF6A00]/10', activeText: 'data-[active=true]:text-[#FF6A00]' },
  ];

  return (
    <Sidebar className="border-r border-[rgba(255,255,255,0.08)] bg-[#0B0F14] text-[#9CA3AF]">
      <SidebarHeader className="border-b px-6 py-6 border-[rgba(255,255,255,0.08)]">
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
            <SidebarMenu className="space-y-2">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      isActive={isActive} 
                      tooltip={item.title} 
                      className={`sidebar-link group px-3 py-5 rounded-xl text-[#E5E7EB] font-medium transition-all duration-300 ${isActive ? `${item.activeBg} ${item.activeText}` : 'hover:bg-[#111827]'}`}
                      render={<Link href={item.url} />}
                    >
                        <item.icon className={`w-5 h-5 mr-3 transition-colors ${item.iconColor}`} strokeWidth={1.5} />
                        <span className="text-[15px]">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[rgba(255,255,255,0.08)] p-4">
        <div className="p-4 bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.08)] mb-4 text-center">
          <p className="text-sm font-semibold text-[#E5E7EB]">Pedro & Angra</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-[#EF4444] hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors py-4 px-3 rounded-xl font-medium">
              <LogOut className="w-5 h-5 mr-3" strokeWidth={1.5} />
              <span className="text-[15px]">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
