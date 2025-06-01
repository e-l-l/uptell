"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar
      collapsible="icon"
      className="border-border bg-background-secondary overflow-hidden group-data-[state=collapsed]:pointer-events-auto group-data-[state=collapsed]:[&_*]:transition-none"
      {...props}
    >
      <SidebarHeader className="flex flex-row items-center px-2 py-6 border-b border-border">
        <SidebarTrigger className="transition-colors hover:bg-background-muted" />
        <div className="group-data-[collapsible=icon]:hidden">
          <h2 className="text-3xl font-bold text-sidebar-foreground tracking-tight">
            uptell
          </h2>
        </div>
      </SidebarHeader>
      <SidebarContent className="group-data-[state=collapsed]:pointer-events-none group-data-[state=collapsed]:overflow-hidden">
        <NavMain />
      </SidebarContent>
      <SidebarFooter className="py-4 border-t border-border group-data-[state=collapsed]:pointer-events-none group-data-[state=collapsed]:overflow-hidden">
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
