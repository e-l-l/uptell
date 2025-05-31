"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { currentOrgAtom, userAtom } from "@/lib/atoms/auth";
import { apiClient } from "@/lib/api-client";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { OrganizationHeader } from "@/components/organization/organization-header";
import { InviteMemberDialog } from "@/components/organization/invite-member-dialog";
import { MembersCard } from "@/components/organization/members-card";
import { OrganizationMember } from "@/types/organization";

export default function OrganizationPage() {
  const [currentOrg] = useAtom(currentOrgAtom);
  const [currentUser] = useAtom(userAtom);
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);

  // Fetch organization members using useQuery
  const {
    data: members = [],
    isLoading: loading,
    error,
  } = useQuery({
    queryKey: ["organizationMembers", currentOrg?.id],
    queryFn: () => apiClient.listOrganizationMembers(currentOrg!.id),
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Check if current user is an owner
  const currentUserMember = members.find(
    (m: OrganizationMember) => m.user_id === currentUser?.id
  );
  const isOwner = currentUserMember?.role === "owner";

  // Show error toast if query fails
  if (error) {
    toast.error("Failed to load organization members");
  }

  const handleRoleChange = async (
    membershipId: string,
    newRole: "owner" | "member"
  ) => {
    try {
      await apiClient.updateUserRole(membershipId, newRole);
      toast.success(`Role updated successfully`);
      // Invalidate and refetch the query
      queryClient.invalidateQueries({
        queryKey: ["organizationMembers", currentOrg?.id],
      });
    } catch (error) {
      console.error("Error updating role:", error);
      toast.error("Failed to update role");
    }
  };

  const handleRemoveMember = async (
    membershipId: string,
    memberName: string
  ) => {
    try {
      await apiClient.removeUserFromOrganization(membershipId, currentOrg!.id);
      toast.success(`${memberName} removed from organization`);
      // Invalidate and refetch the query
      queryClient.invalidateQueries({
        queryKey: ["organizationMembers", currentOrg?.id],
      });
    } catch (error) {
      console.error("Error removing member:", error);
      toast.error("Failed to remove member");
    }
  };

  if (!currentOrg) {
    return (
      <div className="flex flex-1 flex-col gap-4 p-4">
        <div className="text-center py-8">
          <h2 className="text-xl font-semibold text-muted-foreground">
            No organization selected
          </h2>
          <p className="text-sm text-muted-foreground mt-2">
            Please select an organization to view its details.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      <OrganizationHeader
        orgName={currentOrg.name}
        isOwner={isOwner}
        onInviteClick={() => setInviteDialogOpen(true)}
      />

      <Separator />

      <MembersCard
        members={members}
        currentUserId={currentUser?.id}
        isOwner={isOwner}
        orgName={currentOrg.name}
        loading={loading}
        onRoleChange={handleRoleChange}
        onRemoveMember={handleRemoveMember}
      />

      <InviteMemberDialog
        open={inviteDialogOpen}
        onOpenChange={setInviteDialogOpen}
        orgId={currentOrg.id}
        orgName={currentOrg.name}
      />
    </div>
  );
}
