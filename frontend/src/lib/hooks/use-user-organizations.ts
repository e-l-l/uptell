import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";
import { Organization } from "@/lib/atoms/auth";

interface UserOrganization {
  id: string;
  user_id: string;
  org_id: string;
  role: "owner" | "member";
  created_at: string;
}

interface UserOrganizationWithDetails extends UserOrganization {
  organization: Organization;
}

export const useUserOrganizations = (userId: string | undefined) => {
  return useQuery({
    queryKey: ["user-organizations", userId],
    queryFn: async () => {
      if (!userId) return [];

      // Get user organizations
      const userOrgs = await apiClient.listUserOrganizations(userId);

      // Fetch organization details for each (in parallel for better performance)
      const orgsWithDetails = await Promise.all(
        userOrgs.map(async (userOrg: UserOrganization) => {
          const organization = await apiClient.getOrganization(userOrg.org_id);
          return {
            ...userOrg,
            organization,
          };
        })
      );

      return orgsWithDetails;
    },
    enabled: !!userId,
  });
};

export const useCreateOrganization = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ name, userId }: { name: string; userId: string }) => {
      // 1. Create the organization
      const organization = await apiClient.createOrganization(name);

      // 2. Add the user to the organization as owner
      const userOrganization = await apiClient.addUserToOrganization(
        userId,
        organization.id,
        "owner"
      );

      // 3. Set the new organization as current
      apiClient.setCurrentOrganization(organization);

      return { organization, userOrganization };
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["user-organizations", variables.userId],
      });
      toast.success(
        `Organization "${data.organization.name}" created successfully`
      );
    },
    onError: () => {
      toast.error("Failed to create organization");
    },
  });
};
