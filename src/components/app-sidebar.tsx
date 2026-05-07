import { useLocation, Link } from 'react-router-dom';
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
  const { pathname } = useLocation();
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
      <SidebarHeader className="border-b px-4 py-4 border-[rgba(255,255,255,0.08)] group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
        <div className="flex justify-center items-center">
          {/* Default Logo */}
          <div className="w-24 h-8 relative flex items-center justify-center group-data-[collapsible=icon]:hidden">
            <img 
              src="https://iili.io/Bs2OL4s.png" 
              alt="PA Control" 
              className="object-contain w-full h-full"
              referrerPolicy="no-referrer"
            />
          </div>
          {/* Collapsed Icon */}
          <div className="hidden group-data-[collapsible=icon]:flex w-8 h-8 rounded-lg bg-[#FF6A00] items-center justify-center text-white text-xs font-bold tracking-tighter shadow-[0_0_15px_rgba(255,106,0,0.4)]">
            PA
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
                      onClick={() => {
                        if (isMobile) setOpenMobile(false);
                      }}
                      className={`sidebar-link group gap-3 px-3 py-2.5 rounded-lg text-[#E5E7EB] text-[13px] font-medium transition-all duration-150 ease-out active:scale-[0.97] ${isActive ? `${item.activeBg} ${item.activeText}` : 'hover:bg-[#111827]'}`}
                      render={<Link to={item.url} />}
                    >
                        <item.icon className={`w-4 h-4 transition-colors ${item.iconColor}`} strokeWidth={2} />
                        <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-[rgba(255,255,255,0.08)] p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-[#9CA3AF] group gap-3 hover:text-[#EF4444] hover:bg-[#EF4444]/10 transition-all duration-150 ease-out active:scale-[0.97] py-2.5 px-3 rounded-lg text-[13px] font-medium">
              <LogOut className="w-4 h-4" strokeWidth={2} />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
