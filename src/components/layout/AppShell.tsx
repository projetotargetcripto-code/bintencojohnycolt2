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
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import { BarChart3, Building2, Cog, DollarSign, Home, Map, Users, FileText, Hammer, LayoutDashboard } from "lucide-react";
import React from "react";

const sections = [
  {
    label: "Geral",
    items: [
      { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
      { title: "Equipe", url: "/admin/equipe", icon: Users },
      { title: "Leads", url: "/admin/leads", icon: Users },
      { title: "Propostas", url: "/admin/propostas", icon: FileText },
    ],
  },
  {
    label: "Operação",
    items: [
      { title: "Mapa", url: "/admin/mapa", icon: Map },
      { title: "Obras", url: "/admin/obras", icon: Hammer },
    ],
  },
  {
    label: "Financeiro",
    items: [
      { title: "Financeiro", url: "/admin/financeiro", icon: DollarSign },
      { title: "Relatórios", url: "/admin/relatorios", icon: BarChart3 },
    ],
  },
  {
    label: "Configurações",
    items: [
      { title: "Configurações", url: "/admin/configuracoes", icon: Cog },
    ],
  },
];

export function AppSidebar() {
  const location = useLocation();
  const current = location.pathname;

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <div className="px-2 py-2 text-sm font-semibold">Navegação</div>
      </SidebarHeader>
      <SidebarContent>
        {sections.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel>{group.label}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild isActive={current === item.url}>
                      <NavLink to={item.url} className={({ isActive }) => cn(isActive && "text-primary font-medium") }>
                        <item.icon className="mr-2 h-4 w-4" />
                        <span>{item.title}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter>
        <div className="px-2 py-2 text-xs text-muted-foreground">BlockURB © {new Date().getFullYear()}</div>
      </SidebarFooter>
    </Sidebar>
  );
}

interface AppShellProps {
  breadcrumbs?: { label: string; href?: string }[];
  children: React.ReactNode;
}

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Bell, Search, User as UserIcon, LogOut } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/providers/AuthProvider";

export function AppShell({ breadcrumbs = [], children }: AppShellProps) {
  const { user } = useAuth();
  const initials = (user?.email || "BU").slice(0, 2).toUpperCase();

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background text-foreground">
        <header className="sticky top-0 z-40 border-b border-border bg-background/70 backdrop-blur">
          <div className="h-14 container flex items-center gap-3">
            <SidebarTrigger className="mr-2" aria-label="Alternar menu" />
            <a href="/" className="font-bold tracking-tight text-lg"><span className="text-primary">Block</span>URB</a>

            <div className="flex-1 max-w-xl ml-4 hidden md:block">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input placeholder="Buscar…" className="pl-10" aria-label="Buscar" />
              </div>
            </div>

            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" size="icon" aria-label="Notificações"><Bell className="size-5" /></Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="gap-2">
                    <Avatar className="h-6 w-6">
                      <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>
                    <span className="hidden sm:inline text-sm">{user?.email || 'Usuário'}</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Minha conta</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem><UserIcon className="mr-2 size-4" /> Perfil</DropdownMenuItem>
                  <DropdownMenuItem><LogOut className="mr-2 size-4" /> Sair</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </header>

        <div className="flex min-h-[calc(100vh-56px)] w-full">
          <AppSidebar />
          <SidebarInset>
            <main className="container py-6">
              {breadcrumbs.length > 0 && (
                <Breadcrumb>
                  <BreadcrumbList>
                    {breadcrumbs.map((bc, i) => (
                      <React.Fragment key={i}>
                        <BreadcrumbItem>
                          {bc.href ? (
                            <BreadcrumbLink href={bc.href}>{bc.label}</BreadcrumbLink>
                          ) : (
                            <BreadcrumbPage>{bc.label}</BreadcrumbPage>
                          )}
                        </BreadcrumbItem>
                        {i < breadcrumbs.length - 1 && <BreadcrumbSeparator />}
                      </React.Fragment>
                    ))}
                  </BreadcrumbList>
                </Breadcrumb>
              )}

              <div className="mt-4">{children}</div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
