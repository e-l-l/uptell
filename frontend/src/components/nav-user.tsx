"use client";

import {
  BadgeCheck,
  Bell,
  Building2,
  Check,
  ChevronsUpDown,
  LogOut,
  Plus,
} from "lucide-react";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
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
import {
  useUserOrganizations,
  useCreateOrganization,
} from "@/lib/hooks/use-user-organizations";
import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function NavUser() {
  const { isMobile } = useSidebar();
  const user = useAtomValue(userAtom);
  const currentOrg = useAtomValue(currentOrgAtom);
  const router = useRouter();

  const { data: userOrganizations = [] } = useUserOrganizations(user?.id);
  const createOrganization = useCreateOrganization();

  const [isCreateOrgOpen, setIsCreateOrgOpen] = useState(false);
  const [orgName, setOrgName] = useState("");

  const handleSignOut = () => {
    apiClient.signOut();
    router.push("/login");
  };

  const handleSwitchOrganization = (orgId: string) => {
    const selectedOrg = userOrganizations.find(
      (userOrg) => userOrg.organization.id === orgId
    );
    if (selectedOrg) {
      apiClient.setCurrentOrganization(selectedOrg.organization);
      // Optionally refresh the page to ensure all components pick up the new organization
      window.location.reload();
    }
  };

  const handleCreateOrganization = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim() || !user?.id) return;

    try {
      await createOrganization.mutateAsync({
        name: orgName.trim(),
        userId: user.id,
      });
      setOrgName("");
      setIsCreateOrgOpen(false);
      // Refresh the page to ensure all components pick up the new organization
      window.location.reload();
    } catch (error) {
      // Error is handled by the mutation's onError
    }
  };

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <SidebarMenuButton
              size="lg"
              className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
            >
              <Avatar className="h-8 w-8 rounded-lg">
                <AvatarFallback className="rounded-lg">
                  {user?.firstName.charAt(0)}
                  {user?.lastName.charAt(0)}
                </AvatarFallback>
              </Avatar>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-medium">
                  {user?.firstName} {user?.lastName}
                </span>
                <span className="truncate text-xs">{user?.email}</span>
              </div>
              <ChevronsUpDown className="ml-auto size-4" />
            </SidebarMenuButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
            side={isMobile ? "bottom" : "right"}
            align="end"
            sideOffset={4}
          >
            <DropdownMenuLabel className="p-0 font-normal">
              <div className="flex items-center gap-2 px-1 py-1.5 text-left text-sm">
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarFallback className="rounded-lg">
                    {user?.firstName.charAt(0)}
                    {user?.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                  <span className="truncate text-xs">{user?.email}</span>
                </div>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuGroup>
              <DropdownMenuItem>
                <BadgeCheck />
                Account
              </DropdownMenuItem>
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Building2 />
                  Switch Organization
                </DropdownMenuSubTrigger>
                <DropdownMenuSubContent>
                  {userOrganizations.map((userOrg) => (
                    <DropdownMenuItem
                      key={userOrg.organization.id}
                      onClick={() =>
                        handleSwitchOrganization(userOrg.organization.id)
                      }
                    >
                      <div className="flex items-center w-full">
                        <div className="flex-1">
                          <div className="font-medium">
                            {userOrg.organization.name}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {userOrg.role}
                          </div>
                        </div>
                        {currentOrg?.id === userOrg.organization.id && (
                          <Check className="h-4 w-4 ml-2" />
                        )}
                      </div>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator />
                  <Dialog
                    open={isCreateOrgOpen}
                    onOpenChange={setIsCreateOrgOpen}
                  >
                    <DialogTrigger asChild>
                      <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Plus className="h-4 w-4" />
                        Create New Organization
                      </DropdownMenuItem>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Organization</DialogTitle>
                      </DialogHeader>
                      <form
                        onSubmit={handleCreateOrganization}
                        className="space-y-4"
                      >
                        <div className="flex flex-col gap-2">
                          <Label htmlFor="orgName">Organization Name</Label>
                          <Input
                            id="orgName"
                            value={orgName}
                            onChange={(e) => setOrgName(e.target.value)}
                            placeholder="Enter organization name"
                            required
                          />
                        </div>
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => setIsCreateOrgOpen(false)}
                            disabled={createOrganization.isPending}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="submit"
                            disabled={
                              createOrganization.isPending || !orgName.trim()
                            }
                          >
                            {createOrganization.isPending
                              ? "Creating..."
                              : "Create"}
                          </Button>
                        </div>
                      </form>
                    </DialogContent>
                  </Dialog>
                </DropdownMenuSubContent>
              </DropdownMenuSub>
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleSignOut}>
              <LogOut />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
