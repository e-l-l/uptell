import { Button } from "@/components/ui/button";
import { UserPlus } from "lucide-react";

interface OrganizationHeaderProps {
  orgName: string;
  isOwner: boolean;
  onInviteClick: () => void;
}

export function OrganizationHeader({
  orgName,
  isOwner,
  onInviteClick,
}: OrganizationHeaderProps) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{orgName}</h1>
        <p className="text-muted-foreground">
          Manage your organization members and settings
        </p>
      </div>
      {isOwner && (
        <Button className="gap-2" onClick={onInviteClick}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </Button>
      )}
    </div>
  );
}
