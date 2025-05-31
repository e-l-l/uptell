import {
  Table,
  TableBody,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { MemberRow } from "./member-row";
import { MembersLoading } from "./members-loading";
import { OrganizationMember } from "@/types/organization";

interface MembersTableProps {
  members: OrganizationMember[];
  currentUserId?: string;
  isOwner: boolean;
  orgName: string;
  loading: boolean;
  onRoleChange: (membershipId: string, newRole: "owner" | "member") => void;
  onRemoveMember: (membershipId: string, memberName: string) => void;
}

export function MembersTable({
  members,
  currentUserId,
  isOwner,
  orgName,
  loading,
  onRoleChange,
  onRemoveMember,
}: MembersTableProps) {
  if (loading || !members || members.length === 0) {
    return <MembersLoading />;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Member</TableHead>
          <TableHead>Role</TableHead>
          {isOwner && <TableHead className="w-[100px]">Actions</TableHead>}
        </TableRow>
      </TableHeader>
      <TableBody>
        {members.map((member) => (
          <MemberRow
            key={member.id}
            member={member}
            currentUserId={currentUserId}
            isOwner={isOwner}
            orgName={orgName}
            onRoleChange={onRoleChange}
            onRemoveMember={onRemoveMember}
          />
        ))}
      </TableBody>
    </Table>
  );
}
