"use client";

import { LogOut, Building2, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAtomValue } from "jotai";
import { userAtom, currentOrgAtom } from "@/lib/atoms/auth";
import { apiClient } from "@/lib/api-client";
import { useRouter } from "next/navigation";
import { UserAvatar } from "./user-avatar";
import { useUserOrganizations } from "@/lib/hooks/use-user-organizations";
import { CreateOrganizationDialog } from "./create-organization-dialog";
import { Check } from "lucide-react";

interface Organization {
  id: string;
  name: string;
}

interface UserOrganization {
  organization: Organization;
  role: string;
}

export function NavUser() {
  const { isMobile } = useSidebar();
  const user = useAtomValue(userAtom);
  const currentOrg = useAtomValue(currentOrgAtom);
  const router = useRouter();
  const { data: userOrganizations = [] } = useUserOrganizations(user?.id || "");

  const handleSignOut = () => {
    apiClient.signOut();
    router.push("/login");
  };

  const handleSwitchOrganization = (orgId: string) => {
    const selectedOrg = userOrganizations.find(
      (userOrg: UserOrganization) => userOrg.organization.id === orgId
    );
    if (selectedOrg) {
      apiClient.setCurrentOrganization(selectedOrg.organization);
      // Optionally refresh the page to ensure all components pick up the new organization
      window.location.reload();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <SidebarMenu className="space-y-3">
      {/* User Info */}
      <SidebarMenuItem>
        <div className="flex items-center gap-3">
          <UserAvatar user={user} />
        </div>
      </SidebarMenuItem>

      {/* Organization Switcher */}
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton className="w-full justify-between h-11 rounded-lg transition-all duration-200 hover:bg-sidebar-accent/70 group-data-[state=collapsed]:hover:bg-transparent px-3 border border-border hover:border-border/50 group-data-[state=collapsed]:hover:border-border">
              <div className="flex items-center gap-3">
                <div className="h-6 rounded bg-sidebar-primary/10 flex items-center justify-center">
                  <Building2 className="h-4 w-4 text-sidebar-primary" />
                </div>
                <span className="truncate font-medium text-sm text-sidebar-foreground w-36">
                  {currentOrg?.name || "No Organization"}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-sidebar-foreground/60 transition-transform duration-200" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-lg border-border bg-background-secondary"
            side={isMobile ? "bottom" : "right"}
            align="start"
            sideOffset={16}
          >
            {userOrganizations.map((userOrg: UserOrganization) => (
              <DropdownMenuItem
                key={userOrg.organization.id}
                onClick={() =>
                  handleSwitchOrganization(userOrg.organization.id)
                }
                className="rounded-md focus:bg-sidebar-accent/50 cursor-pointer"
              >
                <div className="flex items-center w-full">
                  <div className="flex-1">
                    <div className="font-medium text-sidebar-foreground">
                      {userOrg.organization.name}
                    </div>
                    <div className="text-xs text-sidebar-foreground/60">
                      {userOrg.role}
                    </div>
                  </div>
                  {currentOrg?.id === userOrg.organization.id && (
                    <Check className="h-4 w-4 ml-2 text-sidebar-primary" />
                  )}
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator className="bg-border" />
            <CreateOrganizationDialog userId={user.id} />
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>

      {/* Logout Button */}
      <SidebarMenuItem>
        <SidebarMenuButton
          onClick={handleSignOut}
          className="w-full justify-start h-11 rounded-lg transition-all duration-200 text-destructive hover:text-destructive hover:bg-destructive/10 group-data-[state=collapsed]:hover:bg-transparent border border-transparent hover:border-border group-data-[state=collapsed]:hover:border-transparent px-3 cursor-pointer"
        >
          <div className="h-6 rounded flex items-center justify-center">
            <LogOut className="h-4 w-4" />
          </div>
          <span className="font-medium text-sm">Log out</span>
        </SidebarMenuButton>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
