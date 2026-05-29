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

const navItems = [
  { title: 'Dashboard',              url: '/dashboard',     icon: DashboardIcon  },
  { title: 'Agenda',                 url: '/agenda',        icon: CalendarIcon   },
  { title: 'Clientes & Assinaturas', url: '/subscriptions', icon: CardStackIcon  },
  { title: 'Despesas',               url: '/expenses',      icon: FileTextIcon   },
];

export function AppSidebar() {
  const { pathname } = useLocation();
  const { logout, user } = useAuth();
  const { setOpenMobile, isMobile } = useSidebar();

  const userInitial = user?.email?.[0]?.toUpperCase() ?? 'U';
  const userEmail   = user?.email ?? '';

  return (
    <Sidebar
      collapsible="icon"
      className="border-r-0 bg-sidebar shadow-xl min-h-screen text-sidebar-foreground"
      style={{ borderRight: '1px solid var(--sidebar-border)' }}
    >
      {/* ── Logo ─────────────────────────────────────────────── */}
      <SidebarHeader className="px-4 py-5 group-data-[collapsible=icon]:px-2 group-data-[collapsible=icon]:py-4">
        <div className="flex justify-center items-center">
          {/* Expanded */}
          <div className="w-full flex flex-col items-center gap-2 group-data-[collapsible=icon]:hidden">
            <div className="w-14 h-14 rounded-xl overflow-hidden ring-2 ring-primary/20">
              <img src="https://iili.io/Bs2OL4s.png" alt="PA Control" className="w-full h-full object-cover" />
            </div>
            <div className="text-center">
              <p className="font-semibold text-sm text-foreground tracking-tight">PA Control</p>
              <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-0.5">Micro SaaS</p>
            </div>
          </div>
          {/* Collapsed */}
          <div className="hidden group-data-[collapsible=icon]:flex w-9 h-9 rounded-lg overflow-hidden">
            <img src="https://iili.io/Bs2OL4s.png" alt="PA" className="w-full h-full object-cover" />
          </div>
        </div>
      </SidebarHeader>

      {/* ── Divider ──────────────────────────────────────────── */}
      <div className="mx-4 h-px bg-sidebar-border group-data-[collapsible=icon]:mx-2" />

      {/* ── Nav ──────────────────────────────────────────────── */}
      <SidebarContent className="px-2 pt-3 pb-2 flex-1">
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-0.5">
              {navItems.map((item) => {
                const isActive = pathname.startsWith(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      isActive={isActive}
                      tooltip={item.title}
                      onClick={() => { if (isMobile) setOpenMobile(false); }}
                      className="sidebar-link group gap-3 px-3 py-2.5 rounded-lg text-sidebar-foreground/60 text-[13px] font-medium"
                      render={<Link to={item.url} />}
                    >
                      <item.icon className="w-[17px] h-[17px] flex-shrink-0 transition-transform duration-200 group-hover:scale-105" />
                      <span className="truncate">{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* ── Footer: user + logout ────────────────────────────── */}
      <div className="mx-4 h-px bg-sidebar-border group-data-[collapsible=icon]:mx-2" />
      <SidebarFooter className="p-3 group-data-[collapsible=icon]:p-2 space-y-1">
        {/* User info */}
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0">
          <div className="w-7 h-7 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-semibold flex-shrink-0">
            {userInitial}
          </div>
          <div className="min-w-0 group-data-[collapsible=icon]:hidden">
            <p className="text-[12px] font-medium text-foreground truncate">{userEmail}</p>
            <p className="text-[10px] text-muted-foreground">Administrador</p>
          </div>
        </div>
        {/* Logout */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={logout}
              className="group gap-3 px-3 py-2.5 rounded-lg text-muted-foreground text-[13px] font-medium hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <ExitIcon className="w-[17px] h-[17px] flex-shrink-0" />
              <span className="group-data-[collapsible=icon]:hidden">Sair</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
