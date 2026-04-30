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
  Layers,
  Calendar
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
  useSidebar
} from '@/components/ui/sidebar';
import { useAuth } from './auth-provider';

export function AppSidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const navItems = [
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, iconColor: 'group-[[data-active=true]]:text-[#3B82F6] text-[#9CA3AF] group-hover:text-[#3B82F6]', activeBg: 'data-[active=true]:bg-[#3B82F6]/10', activeText: 'data-[active=true]:text-[#3B82F6]' },
    { title: 'Agenda', url: '/agenda', icon: Calendar, iconColor: 'group-[[data-active=true]]:text-[#10B981] text-[#9CA3AF] group-hover:text-[#10B981]', activeBg: 'data-[active=true]:bg-[#10B981]/10', activeText: 'data-[active=true]:text-[#10B981]' },
    { title: 'Assinaturas', url: '/subscriptions', icon: CreditCard, iconColor: 'group-[[data-active=true]]:text-[#8B5CF6] text-[#9CA3AF] group-hover:text-[#8B5CF6]', activeBg: 'data-[active=true]:bg-[#8B5CF6]/10', activeText: 'data-[active=true]:text-[#8B5CF6]' },
    { title: 'Despesas', url: '/expenses', icon: Receipt, iconColor: 'group-[[data-active=true]]:text-[#FF6A00] text-[#9CA3AF] group-hover:text-[#FF6A00]', activeBg: 'data-[active=true]:bg-[#FF6A00]/10', activeText: 'data-[active=true]:text-[#FF6A00]' },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r border-[rgba(255,255,255,0.08)] bg-[#0B0F14] text-[#9CA3AF]">
      <SidebarHeader className="border-b px-6 py-6 border-[rgba(255,255,255,0.08)] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
        <div className="flex justify-center items-center">
          {/* Default Logo */}
          <div className="w-48 h-16 relative flex items-center justify-center group-data-[collapsible=icon]:hidden">
            <Image 
              src="https://iili.io/Bs2OL4s.png" 
              alt="PA Control" 
              fill
              className="object-contain"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Collapsed Icon */}
          <div className="hidden group-data-[collapsible=icon]:flex w-8 h-8 rounded-lg bg-[#FF6A00] items-center justify-center text-white font-bold tracking-tighter shadow-[0_0_15px_rgba(255,106,0,0.4)]">
            PA
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
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                      className={`sidebar-link group gap-3 px-3 py-5 rounded-xl text-[#E5E7EB] font-medium transition-all duration-300 ${isActive ? `${item.activeBg} ${item.activeText}` : 'hover:bg-[#111827]'}`}
                      render={<Link href={item.url} />}
                    >
                        <item.icon className={`w-5 h-5 transition-colors ${item.iconColor}`} strokeWidth={1.5} />
                        <span className="text-[15px]">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[rgba(255,255,255,0.08)] p-4 group-data-[collapsible=icon]:p-2">
        <div className="p-4 bg-[#111827] rounded-xl border border-[rgba(255,255,255,0.08)] mb-4 text-center group-data-[collapsible=icon]:hidden">
          <p className="text-sm font-semibold text-[#E5E7EB]">Pedro & Angra</p>
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-[#EF4444] group gap-3 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-colors py-4 px-3 rounded-xl font-medium">
              <LogOut className="w-5 h-5" strokeWidth={1.5} />
              <span className="text-[15px] group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
