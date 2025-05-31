import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { User } from "lucide-react";
import { MembersTable } from "./members-table";
import { OrganizationMember } from "@/types/organization";

interface MembersCardProps {
  members: OrganizationMember[];
  currentUserId?: string;
  isOwner: boolean;
  orgName: string;
  loading: boolean;
  onRoleChange: (membershipId: string, newRole: "owner" | "member") => void;
  onRemoveMember: (membershipId: string, memberName: string) => void;
}

export function MembersCard({
  members,
  currentUserId,
  isOwner,
  orgName,
  loading,
  onRoleChange,
  onRemoveMember,
}: MembersCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Members ({members.length})
        </CardTitle>
        <CardDescription>
          Manage organization members and their roles
        </CardDescription>
      </CardHeader>
      <CardContent>
        <MembersTable
          members={members}
          currentUserId={currentUserId}
          isOwner={isOwner}
          orgName={orgName}
          loading={loading}
          onRoleChange={onRoleChange}
          onRemoveMember={onRemoveMember}
        />
      </CardContent>
    </Card>
  );
}
