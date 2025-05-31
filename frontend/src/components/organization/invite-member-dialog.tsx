import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Mail } from "lucide-react";
import { apiClient } from "@/lib/api-client";
import { toast } from "sonner";

interface InviteMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  orgId: string;
  orgName: string;
}

export function InviteMemberDialog({
  open,
  onOpenChange,
  orgId,
  orgName,
}: InviteMemberDialogProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "member">("member");
  const [inviteExpiresAt, setInviteExpiresAt] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );
  const [inviteLoading, setInviteLoading] = useState(false);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const handleInviteMember = async () => {
    if (!orgId || !inviteEmail.trim()) return;

    try {
      setInviteLoading(true);
      const invite = await apiClient.createOrganizationInvite(
        orgId,
        inviteEmail.trim(),
        inviteRole,
        inviteExpiresAt
      );

      // Copy invite link to clipboard
      const inviteLink = `${window.location.origin}/join/${invite.code}`;
      await navigator.clipboard.writeText(inviteLink);

      toast.success("Invitation created and link copied to clipboard!");
      onOpenChange(false);
      setInviteEmail("");
      setInviteRole("member");
      setInviteExpiresAt(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)); // Reset to 7 days
    } catch (error) {
      console.error("Error creating invite:", error);
      toast.error("Failed to create invitation");
    } finally {
      setInviteLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite New Member</DialogTitle>
          <DialogDescription>
            Send an invitation to join {orgName}. The invite link will be copied
            to your clipboard.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="Enter email address"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
          </div>
          <div className="flex gap-4">
            <div className="grid gap-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={inviteRole}
                onValueChange={(value: "owner" | "member") =>
                  setInviteRole(value)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="member">Member</SelectItem>
                  <SelectItem value="owner">Owner</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="expires-at">Expires On</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full justify-start text-left font-normal"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formatDate(inviteExpiresAt)}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={inviteExpiresAt}
                    onSelect={(date) => date && setInviteExpiresAt(date)}
                    disabled={(date) => date < new Date()}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleInviteMember}
            disabled={!inviteEmail.trim() || inviteLoading}
            className="gap-2"
          >
            {inviteLoading ? (
              <>Creating...</>
            ) : (
              <>
                <Mail className="h-4 w-4" />
                Send Invite
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
