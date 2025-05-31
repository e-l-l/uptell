import { UserPlus } from "lucide-react";
import { GradButton } from "../ui/grad-button";

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
        <GradButton className="gap-2" onClick={onInviteClick}>
          <UserPlus className="h-4 w-4" />
          Invite Member
        </GradButton>
      )}
    </div>
  );
}
