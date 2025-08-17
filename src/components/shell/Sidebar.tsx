import { NavLink, useLocation } from "react-router-dom";
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
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { NAV, inferMenuKey } from "@/config/nav";
import { useAuthorization } from "@/hooks/useAuthorization";
import type { LucideIcon } from "lucide-react";
import {
  Layout,
  LayoutDashboard,
  Users,
  Inbox,
  FileText,
  Map,
  MapPin,
  DollarSign,
  BarChart3,
  Settings,
  Building2,
  Network,
  User,
  Shield,
  Calendar,
  Circle,
  CheckCircle,
  PlusCircle,
  Key,
  Wrench,
  ScrollText,
  Calculator,
  Megaphone,
  Briefcase,
  Home,
  Hammer,
  LineChart,
  Landmark,
} from "lucide-react";

const ICONS = {
  layout: Layout,
  "layout-dashboard": LayoutDashboard,
  users: Users,
  inbox: Inbox,
  file: FileText,
  map: Map,
  "map-pin": MapPin,
  "dollar-sign": DollarSign,
  chart: BarChart3,
  "bar-chart-2": BarChart3,
  settings: Settings,
  building: Building2,
  network: Network,
  user: User,
  shield: Shield,
  calendar: Calendar,
  "check-circle": CheckCircle,
  "plus-circle": PlusCircle,
  key: Key,
  wrench: Wrench,
  "scroll-text": ScrollText,
  calculator: Calculator,
  megaphone: Megaphone,
  briefcase: Briefcase,
  home: Home,
  hammer: Hammer,
  "line-chart": LineChart,
  landmark: Landmark,
} satisfies Record<string, LucideIcon>;

export type IconName = keyof typeof ICONS;

export interface NavItem {
  title?: string;
  label?: string;
  href: string;
  icon?: IconName;
  panelKey?: string;
}
function IconByName({ name }: { name?: IconName }) {
  const Comp = (name && ICONS[name]) || Circle;
  return <Comp className="mr-2 h-4 w-4" />;
}

export function AppSidebar({ menuKey }: { menuKey?: string }) {
  const location = useLocation();
  const current = location.pathname;
  const key = menuKey || inferMenuKey(current);
  const { profile } = useAuthorization();
  const rawItems: NavItem[] = NAV[key] || [];
  const isSuperAdmin = profile?.role === 'superadmin';
  const panels = Array.isArray(profile?.panels) ? (profile?.panels as string[]) : [];
  const items = rawItems.filter((item) => {
    // Se não tiver panelKey, sempre mostra
    if (!item.panelKey) return true;
    // Super Admin sempre vê
    if (isSuperAdmin) return true;
    // Somente mostra se o painel estiver permitido
    return panels.includes(item.panelKey);
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-3 flex items-center gap-2">
          <img src="/lovable-uploads/69c3ca3e-8a72-4b83-8f97-2ffdd18f9508.png" alt="Símbolo BlockURB" className="h-6 w-6 rounded-sm" loading="lazy" decoding="async" />
          <span className="text-sm font-semibold">BlockURB</span>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={current === item.href}>
                    <NavLink to={item.href} className={({ isActive }) => cn(isActive && "text-primary font-medium")}>
                      <IconByName name={item.icon} />
                      <span>{item.label ?? item.title}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">BlockURB © {new Date().getFullYear()}</div>
      </SidebarFooter>
    </Sidebar>
  );
}
