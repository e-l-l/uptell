"use client";

import { useState } from "react";
import { useAtom } from "jotai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { currentOrgAtom, userAtom } from "@/lib/atoms/auth";
import { apiClient } from "@/lib/api-client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import {
  MoreHorizontal,
  UserPlus,
  Crown,
  User,
  Trash2,
  Mail,
  CalendarIcon,
} from "lucide-react";

interface UserOrganization {
  id: string;
  user_id: string;
  org_id: string;
  role: "owner" | "member";
}

interface OrganizationMember extends UserOrganization {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
}

export default function OrganizationPage() {
  const [currentOrg] = useAtom(currentOrgAtom);
  const [currentUser] = useAtom(userAtom);
  const queryClient = useQueryClient();
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"owner" | "member">("member");
  const [inviteExpiresAt, setInviteExpiresAt] = useState<Date>(
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Default to 7 days from now
  );
  const [inviteLoading, setInviteLoading] = useState(false);

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

  const handleInviteMember = async () => {
    if (!currentOrg?.id || !inviteEmail.trim()) return;

    try {
      setInviteLoading(true);
      const invite = await apiClient.createOrganizationInvite(
        currentOrg.id,
        inviteEmail.trim(),
        inviteRole,
        inviteExpiresAt
      );

      // Copy invite link to clipboard
      const inviteLink = `${window.location.origin}/join/${invite.code}`;
      await navigator.clipboard.writeText(inviteLink);

      toast.success("Invitation created and link copied to clipboard!");
      setInviteDialogOpen(false);
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

  const getInitials = (first_name: string, last_name: string) => {
    return `${first_name.charAt(0)}${last_name.charAt(0)}`.toUpperCase();
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "owner" ? "default" : "secondary";
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {currentOrg.name}
          </h1>
          <p className="text-muted-foreground">
            Manage your organization members and settings
          </p>
        </div>
        {isOwner && (
          <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <UserPlus className="h-4 w-4" />
                Invite Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Invite New Member</DialogTitle>
                <DialogDescription>
                  Send an invitation to join {currentOrg.name}. The invite link
                  will be copied to your clipboard.
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
                <Button
                  variant="outline"
                  onClick={() => setInviteDialogOpen(false)}
                >
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
        )}
      </div>

      <Separator />

      {/* Members */}
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
          {loading || !members || members.length === 0 ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-3 w-[100px]" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Role</TableHead>
                  {isOwner && (
                    <TableHead className="w-[100px]">Actions</TableHead>
                  )}
                </TableRow>
              </TableHeader>
              <TableBody>
                {members.map((member: OrganizationMember) => (
                  <TableRow key={member.id}>
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
                            {member.user_id === currentUser?.id && (
                              <span className="text-xs text-muted-foreground ml-2">
                                (You)
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={getRoleBadgeVariant(member.role)}
                        className="gap-1"
                      >
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
                        {member.user_id !== currentUser?.id && (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() =>
                                  handleRoleChange(
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
                                    <AlertDialogTitle>
                                      Remove Member
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to remove{" "}
                                      {member.first_name} {member.last_name}{" "}
                                      from {currentOrg.name}? This action cannot
                                      be undone.
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>
                                      Cancel
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() =>
                                        handleRemoveMember(
                                          member.user_id,
                                          `${member.first_name} ${member.last_name}`
                                        )
                                      }
                                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                    >
                                      Remove
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
