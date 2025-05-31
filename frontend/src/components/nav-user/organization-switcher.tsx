import { Building2, Check } from "lucide-react";
import {
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useUserOrganizations } from "@/lib/hooks/use-user-organizations";
import { apiClient } from "@/lib/api-client";
import { CreateOrganizationDialog } from "./create-organization-dialog";

interface Organization {
  id: string;
  name: string;
}

interface UserOrganization {
  organization: Organization;
  role: string;
}

interface OrganizationSwitcherProps {
  userId: string;
  currentOrgId: string | undefined;
}

export function OrganizationSwitcher({
  userId,
  currentOrgId,
}: OrganizationSwitcherProps) {
  const { data: userOrganizations = [] } = useUserOrganizations(userId);

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

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger>
        <Building2 />
        Switch Organization
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent>
        {userOrganizations.map((userOrg: UserOrganization) => (
          <DropdownMenuItem
            key={userOrg.organization.id}
            onClick={() => handleSwitchOrganization(userOrg.organization.id)}
          >
            <div className="flex items-center w-full">
              <div className="flex-1">
                <div className="font-medium">{userOrg.organization.name}</div>
                <div className="text-xs text-muted-foreground">
                  {userOrg.role}
                </div>
              </div>
              {currentOrgId === userOrg.organization.id && (
                <Check className="h-4 w-4 ml-2" />
              )}
            </div>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <CreateOrganizationDialog userId={userId} />
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}
