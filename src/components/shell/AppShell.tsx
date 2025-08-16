import React from "react";
import { SidebarProvider, SidebarTrigger, SidebarInset } from "@/components/ui/sidebar";
import { Topbar } from "./Topbar";
import { AppSidebar } from "./Sidebar";

export interface AppShellProps {
  breadcrumbs?: { label: string; href?: string }[];
  menuKey?: string;
  children: React.ReactNode;
}

export function AppShell({ breadcrumbs = [], menuKey, children }: AppShellProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen w-full bg-background text-foreground">
        <Topbar breadcrumbs={breadcrumbs} />
        <div className="flex min-h-[calc(100vh-56px)] w-full">
          <AppSidebar menuKey={menuKey} />
          <SidebarInset>
            <main className="container py-6">
              <div className="mt-4">{children}</div>
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
