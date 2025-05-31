import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Crown, User, Trash2 } from "lucide-react";
import { OrganizationMember } from "@/types/organization";

interface MemberActionsProps {
  member: OrganizationMember;
  orgName: string;
  onRoleChange: (membershipId: string, newRole: "owner" | "member") => void;
  onRemoveMember: (membershipId: string, memberName: string) => void;
}

export function MemberActions({
  member,
  orgName,
  onRoleChange,
  onRemoveMember,
}: MemberActionsProps) {
  const memberName = `${member.first_name} ${member.last_name}`;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem
          onClick={() =>
            onRoleChange(
              member.id,
              member.role === "owner" ? "member" : "owner"
            )
          }
        >
          {member.role === "owner" ? (
            <>
              <User className="h-4 w-4 mr-2" />
              Make Member
            </>
          ) : (
            <>
              <Crown className="h-4 w-4 mr-2" />
              Make Owner
            </>
          )}
        </DropdownMenuItem>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <DropdownMenuItem
              onSelect={(e) => e.preventDefault()}
              className="text-destructive focus:text-destructive"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Remove Member
            </DropdownMenuItem>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Remove Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to remove {memberName} from {orgName}?
                This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => onRemoveMember(member.user_id, memberName)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Remove
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
