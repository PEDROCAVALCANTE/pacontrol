import { useLocation, Link } from 'react-router-dom';
import {
  DashboardIcon,
  CardStackIcon,
  FileTextIcon,
  ExitIcon,
  CalendarIcon,
} from '@radix-ui/react-icons';
import { MessageCircle, Sun, Moon } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { useAuth } from './auth-provider';
import { useTheme } from './theme-provider';

const LOGO = 'https://iili.io/Bs2OL4s.png';

const navItems = [
  { title: 'Visão geral',  url: '/dashboard',     icon: DashboardIcon },
  { title: 'Agenda',       url: '/agenda',        icon: CalendarIcon },
  { title: 'Assinaturas',  url: '/subscriptions', icon: CardStackIcon },
  { title: 'Despesas',     url: '/expenses',      icon: FileTextIcon },
  { title: 'WhatsApp',     url: '/whatsapp',      icon: MessageCircle },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();
  const { theme, setTheme } = useTheme();

  const initial = user?.email?.[0]?.toUpperCase() ?? 'U';
  const email = user?.email ?? '';
  const isDark = theme === 'dark';

  return (
    <Sidebar collapsible="icon" className="min-h-screen border-r border-sidebar-border bg-sidebar">
      {/* Logo */}
      <SidebarHeader className="px-4 py-5 group-data-[collapsible=icon]:px-3">
        <div className="flex items-center gap-2.5 group-data-[collapsible=icon]:justify-center">
          <div className="w-7 h-7 rounded-[9px] overflow-hidden shrink-0 bg-primary">
            <img src={LOGO} alt="PA Control" className="w-full h-full object-cover" />
          </div>
          <p className="text-[13.5px] font-semibold tracking-tight text-sidebar-foreground group-data-[collapsible=icon]:hidden">
            PA Control
          </p>
        </div>
      </SidebarHeader>

      {/* Navegação */}
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map(item => {
                const isActive = pathname === item.url
                  || (item.url !== '/dashboard' && pathname.startsWith(item.url))
                  || (item.url === '/dashboard' && pathname === '/');
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                      className="sidebar-link gap-2.5 px-2.5 h-9 text-[13px] font-medium text-sidebar-foreground/70 data-[active=true]:text-primary"
                      render={<Link to={item.url} />}
                    >
                      <item.icon className="w-4 h-4 shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Rodapé */}
      <SidebarFooter className="p-2 gap-0.5">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              tooltip={isDark ? 'Modo claro' : 'Modo escuro'}
              className="sidebar-link gap-2.5 px-2.5 h-9 text-[13px] font-medium text-sidebar-foreground/70"
            >
              {isDark ? <Sun className="w-4 h-4 shrink-0" /> : <Moon className="w-4 h-4 shrink-0" />}
              <span className="group-data-[collapsible=icon]:hidden">
                {isDark ? 'Modo claro' : 'Modo escuro'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex items-center gap-2.5 px-2.5 py-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[11px] font-semibold
                          bg-[var(--primary-soft)] text-primary">
            {initial}
          </div>
          <p className="text-[11px] text-sidebar-foreground/60 truncate group-data-[collapsible=icon]:hidden">
            {email}
          </p>
        </div>

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Sair"
              className="sidebar-link gap-2.5 px-2.5 h-9 text-[13px] font-medium text-sidebar-foreground/70 hover:text-[var(--danger)]"
            >
              <ExitIcon className="w-4 h-4 shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
