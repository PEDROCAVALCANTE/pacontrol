import { useLocation, Link } from 'react-router-dom';
import {
  DashboardIcon,
  CardStackIcon,
  FileTextIcon,
  ExitIcon,
  CalendarIcon,
} from '@radix-ui/react-icons';
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

const LOGO = 'https://iili.io/Bs2OL4s.png';

const navItems = [
  { title: 'Dashboard',              url: '/dashboard',     icon: DashboardIcon },
  { title: 'Agenda',                 url: '/agenda',        icon: CalendarIcon  },
  { title: 'Clientes & Assinaturas', url: '/subscriptions', icon: CardStackIcon },
  { title: 'Despesas',               url: '/expenses',      icon: FileTextIcon  },
];

export function AppSidebar() {
  const { pathname }               = useLocation();
  const { logout, user }           = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const initial  = user?.email?.[0]?.toUpperCase() ?? 'U';
  const email    = user?.email ?? '';

  return (
    <Sidebar
      collapsible="icon"
      className="min-h-screen text-sidebar-foreground"
      style={{
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--sidebar-border)',
      }}
    >
      {/* ── Logo ──────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-6 group-data-[collapsible=icon]:px-3 group-data-[collapsible=icon]:py-4">
        {/* Expanded */}
        <div className="flex items-center gap-3 group-data-[collapsible=icon]:hidden">
          <img src={LOGO} alt="PA" className="w-8 h-8 rounded-lg object-cover flex-shrink-0" />
          <div>
            <p className="text-sm font-semibold text-foreground leading-none">PA Control</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Micro SaaS</p>
          </div>
        </div>
        {/* Collapsed */}
        <div className="hidden group-data-[collapsible=icon]:flex justify-center">
          <img src={LOGO} alt="PA" className="w-8 h-8 rounded-lg object-cover" />
        </div>
      </SidebarHeader>

      <div className="mx-3 h-px bg-sidebar-border" />

      {/* ── Nav ───────────────────────────────────────────── */}
      <SidebarContent className="px-2 py-3">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map(item => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                      className="sidebar-link group gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-sidebar-foreground/55 h-9"
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

      {/* ── Footer ────────────────────────────────────────── */}
      <div className="mx-3 h-px bg-sidebar-border" />
      <SidebarFooter className="p-2 space-y-0.5">
        {/* User */}
        <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-semibold"
               style={{ background: 'rgba(255,106,0,0.15)', color: '#FF6A00' }}>
            {initial}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[11px] font-medium text-foreground truncate leading-none">{email}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5">Admin</p>
          </div>
        </div>

        {/* Logout */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="group gap-3 px-3 py-2 rounded-lg text-[13px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors h-9"
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
