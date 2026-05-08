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
    { title: 'Dashboard', url: '/dashboard', icon: LayoutDashboard, iconColor: 'text-blue-500 group-hover:text-blue-400', activeBg: 'data-[active=true]:bg-accent', activeText: 'data-[active=true]:text-accent-foreground' },
    { title: 'Agenda', url: '/agenda', icon: Calendar, iconColor: 'text-indigo-500 group-hover:text-indigo-400', activeBg: 'data-[active=true]:bg-accent', activeText: 'data-[active=true]:text-accent-foreground' },
    { title: 'Clientes', url: '/clients', icon: Users, iconColor: 'text-emerald-500 group-hover:text-emerald-400', activeBg: 'data-[active=true]:bg-accent', activeText: 'data-[active=true]:text-accent-foreground' },
    { title: 'Assinaturas', url: '/subscriptions', icon: CreditCard, iconColor: 'text-purple-500 group-hover:text-purple-400', activeBg: 'data-[active=true]:bg-accent', activeText: 'data-[active=true]:text-accent-foreground' },
    { title: 'Despesas', url: '/expenses', icon: Receipt, iconColor: 'text-rose-500 group-hover:text-rose-400', activeBg: 'data-[active=true]:bg-accent', activeText: 'data-[active=true]:text-accent-foreground' },
  ];

  return (
    <Sidebar collapsible="icon" className="border-r-0 glass-panel shadow-lg min-h-screen text-card-foreground">
      <SidebarHeader className="border-b px-4 py-4 border-border group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
        <div className="flex justify-center items-center">
          {/* Default Logo */}
          <div className="w-full relative flex flex-col items-center justify-center gap-3 px-2 py-2 group-data-[collapsible=icon]:hidden">
            <div className="w-20 h-20 rounded-lg flex items-center justify-center overflow-hidden">
              <img src="https://iili.io/BsHmxFR.png" alt="PA Control Logo" className="w-full h-full object-cover" />
            </div>
            <span className="font-semibold tracking-tight text-xl mt-2">PA Control</span>
          </div>
          {/* Collapsed Icon */}
          <div className="hidden group-data-[collapsible=icon]:flex w-10 h-10 rounded-lg items-center justify-center overflow-hidden">
            <img src="https://iili.io/BsHmxFR.png" alt="PA Control Logo" className="w-full h-full object-cover" />
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
                      className={`sidebar-link group gap-3 px-3 py-2.5 rounded-md text-foreground/70 text-[13px] font-medium transition-all duration-150 ease-out active:scale-[0.97] ${isActive ? `${item.activeBg} ${item.activeText}` : 'hover:bg-accent hover:text-accent-foreground'}`}
                      render={<Link to={item.url} />}
                    >
                        <item.icon className={`w-[18px] h-[18px] transition-colors ${item.iconColor}`} strokeWidth={1.5} />
                        <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter className="border-t border-border p-3 group-data-[collapsible=icon]:p-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={logout} className="text-foreground/70 group gap-3 hover:text-destructive hover:bg-destructive/10 transition-all duration-150 ease-out active:scale-[0.97] py-2.5 px-3 rounded-md text-[13px] font-medium">
              <LogOut className="w-[18px] h-[18px]" strokeWidth={1.5} />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
