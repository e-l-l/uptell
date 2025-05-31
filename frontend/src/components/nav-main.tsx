"use client";

import {
  LayoutDashboard,
  Briefcase,
  AlertTriangle,
  Building2,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

const items = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
  },
  {
    title: "Applications",
    url: "/applications",
    icon: Briefcase,
  },
  {
    title: "Incidents",
    url: "/incidents",
    icon: AlertTriangle,
  },
  {
    title: "Organizations",
    url: "/organizations",
    icon: Building2,
  },
];

export function NavMain() {
  const pathname = usePathname();

  return (
    <SidebarGroup>
      <SidebarMenu className="space-y-1">
        {items.map((item) => {
          const isActive = pathname === item.url;
          return (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                className={`
                  group relative h-11 rounded-lg transition-all duration-200 ease-in-out
                  ${
                    isActive
                      ? "bg-background-active shadow-sm"
                      : "hover:bg-background-muted"
                  }
                `}
              >
                <Link href={item.url} className="flex items-center gap-3 px-3">
                  {item.icon && (
                    <item.icon
                      className={`
                      h-5 w-5 transition-transform duration-200 group-hover:scale-110
                      ${isActive ? "text-sidebar-primary-foreground" : ""}
                    `}
                    />
                  )}
                  <span className="font-medium text-[15px] tracking-tight">
                    {item.title}
                  </span>
                  {isActive && (
                    <div className="absolute left-0 top-1/2 h-6 w-1 bg-sidebar-primary-foreground rounded-full transform -translate-y-1/2 -translate-x-1" />
                  )}
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          );
        })}
      </SidebarMenu>
    </SidebarGroup>
  );
}
