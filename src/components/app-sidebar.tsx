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
  { title: 'Dashboard',              url: '/dashboard',     icon: DashboardIcon },
  { title: 'Agenda',                 url: '/agenda',        icon: CalendarIcon  },
  { title: 'Clientes & Assinaturas', url: '/subscriptions', icon: CardStackIcon },
  { title: 'Despesas',               url: '/expenses',      icon: FileTextIcon  },
  { title: 'WhatsApp',               url: '/whatsapp',      icon: MessageCircle },
];

export function AppSidebar() {
  const { pathname }                = useLocation();
  const { logout, user }            = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();
  const { theme, setTheme }         = useTheme();

  const initial = user?.email?.[0]?.toUpperCase() ?? 'U';
  const email   = user?.email ?? '';
  const isDark  = theme === 'dark';

  return (
    <Sidebar
      collapsible="icon"
      className="min-h-screen"
      style={{
        background:   'var(--sidebar)',
        borderRight:  '1px solid var(--sidebar-border)',
        color:        'var(--sidebar-foreground)',
      }}
    >
      {/* ── Logo ───────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-5 group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:py-4">
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden"
               style={{ background: 'oklch(63% 0.22 48)', boxShadow: '0 2px 8px oklch(63% 0.22 48 / 0.35)' }}>
            <img src={LOGO} alt="PA" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="text-[13px] font-bold leading-none" style={{ color: 'var(--sidebar-foreground)' }}>
              PA Control
            </p>
            <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--sidebar-foreground)', opacity: 0.45 }}>
              Gestão financeira
            </p>
          </div>
        </div>
        <div className="hidden group-data-[collapsible=icon]:flex justify-center">
          <div className="w-8 h-8 rounded-xl overflow-hidden"
               style={{ background: 'oklch(63% 0.22 48)', boxShadow: '0 2px 8px oklch(63% 0.22 48 / 0.35)' }}>
            <img src={LOGO} alt="PA" className="w-full h-full object-cover" />
          </div>
        </div>
      </SidebarHeader>

      <div className="mx-3 h-px" style={{ background: 'var(--sidebar-border)' }} />

      {/* ── Nav ────────────────────────────────────────────── */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map(item => {
                const isActive = pathname === item.url || (item.url !== '/dashboard' && pathname.startsWith(item.url));
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                      className="sidebar-link group gap-3 px-3 py-2 text-[13px] font-medium h-9"
                      style={{ color: isActive ? 'oklch(55% 0.22 48)' : 'var(--sidebar-foreground)', opacity: isActive ? 1 : 0.55 }}
                      render={<Link to={item.url} />}
                    >
                      <item.icon className="w-4 h-4 flex-shrink-0" />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer ─────────────────────────────────────────── */}
      <div className="mx-3 h-px" style={{ background: 'var(--sidebar-border)' }} />
      <SidebarFooter className="p-2 space-y-0.5">

        {/* Theme toggle */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              tooltip={isDark ? 'Modo claro' : 'Modo escuro'}
              className="group gap-3 px-3 py-2 rounded-lg text-[13px] font-medium h-9 transition-colors"
              style={{ color: 'var(--sidebar-foreground)', opacity: 0.5 }}
            >
              {isDark
                ? <Sun  className="w-4 h-4 flex-shrink-0" />
                : <Moon className="w-4 h-4 flex-shrink-0" />}
              <span className="group-data-[collapsible=icon]:hidden">
                {isDark ? 'Modo claro' : 'Modo escuro'}
              </span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold"
               style={{ background: 'oklch(63% 0.22 48 / 0.15)', color: 'oklch(55% 0.22 48)' }}>
            {initial}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[11px] font-semibold truncate leading-none" style={{ color: 'var(--sidebar-foreground)' }}>
              {email}
            </p>
            <p className="text-[10px] mt-0.5 font-medium" style={{ color: 'var(--sidebar-foreground)', opacity: 0.4 }}>
              Admin
            </p>
          </div>
        </div>

        {/* Logout */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              tooltip="Sair"
              className="group gap-3 px-3 py-2 rounded-lg text-[13px] font-medium h-9 transition-colors hover:bg-red-50 dark:hover:bg-red-950/30"
              style={{ color: 'var(--sidebar-foreground)', opacity: 0.45 }}
            >
              <ExitIcon className="w-4 h-4 flex-shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
