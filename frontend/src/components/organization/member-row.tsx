import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Crown, User } from "lucide-react";
import { MemberActions } from "./member-actions";
import { OrganizationMember } from "@/types/organization";

interface MemberRowProps {
  member: OrganizationMember;
  currentUserId?: string;
  isOwner: boolean;
  orgName: string;
  onRoleChange: (membershipId: string, newRole: "owner" | "member") => void;
  onRemoveMember: (membershipId: string, memberName: string) => void;
}

export function MemberRow({
  member,
  currentUserId,
  isOwner,
  orgName,
  onRoleChange,
  onRemoveMember,
}: MemberRowProps) {
  const getInitials = (first_name: string, last_name: string) => {
    return `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "owner" ? "default" : "secondary";
  };

  return (
    <TableRow>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar>
            <AvatarFallback className="bg-primary/10 text-primary">
              {getInitials(member.first_name, member.last_name)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">
              {member.first_name} {member.last_name}
              {member.user_id === currentUserId && (
                <span className="text-xs text-muted-foreground ml-2">
                  (You)
                </span>
              )}
            </p>
            <p className="text-sm text-muted-foreground">{member.email}</p>
          </div>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={getRoleBadgeVariant(member.role)} className="gap-1">
          {member.role === "owner" ? (
            <Crown className="h-3 w-3" />
          ) : (
            <User className="h-3 w-3" />
          )}
          {member.role}
        </Badge>
      </TableCell>
      {isOwner && (
        <TableCell>
          {member.user_id !== currentUserId && (
            <MemberActions
              member={member}
              orgName={orgName}
              onRoleChange={onRoleChange}
              onRemoveMember={onRemoveMember}
            />
          )}
        </TableCell>
      )}
    </TableRow>
  );
}
