"use client";

import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { apiClient } from "@/lib/api-client";
import { authAtom } from "@/lib/atoms/auth";
import { toast } from "sonner";
import {
  Building2,
  Crown,
  User,
  CheckCircle,
  XCircle,
  Clock,
} from "lucide-react";

export default function JoinWithCodePage() {
  const router = useRouter();
  const params = useParams();
  const code = params.code as string;
  const [{ user, isAuthenticated }] = useAtom(authAtom);
  const [isJoining, setIsJoining] = useState(false);
  const queryClient = useQueryClient();
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login?redirect=/join/" + code);
    }
  }, [isAuthenticated, router, code]);

  // Fetch invite details
  const {
    data: invite,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["invite", code],
    queryFn: () => apiClient.getInviteDetails(code),
    enabled: !!code,
    retry: false,
  });

  const handleJoinOrganization = async () => {
    if (!invite || !user?.id) return;

    try {
      setIsJoining(true);
      const result = await apiClient.joinOrganization(code);
      // Invalidate relevant queries
      queryClient.invalidateQueries({ queryKey: ["organizations"] });
      queryClient.invalidateQueries({ queryKey: ["organizationMembers"] });

      toast.success(`Successfully joined ${invite.organization.name}!`);
      router.push("/dashboard");
    } catch (err: any) {
      console.error("Error joining organization:", err);
      toast.error(err.message || "Failed to join organization");
    } finally {
      setIsJoining(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const isExpired = (dateString: string) => {
    return new Date(dateString) < new Date();
  };

  const getRoleBadgeVariant = (role: string) => {
    return role === "owner" ? "default" : "secondary";
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-4 w-full" />
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <XCircle className="h-5 w-5" />
              Invalid Invite
            </CardTitle>
            <CardDescription>
              This invitation link is invalid or has been revoked.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (isExpired(invite.expires_at)) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <Clock className="h-5 w-5" />
              Invite Expired
            </CardTitle>
            <CardDescription>
              This invitation expired on {formatDate(invite.expires_at)}. Please
              request a new invitation.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button
              variant="outline"
              className="w-full"
              onClick={() => router.push("/dashboard")}
            >
              Go to Dashboard
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-1 items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-500" />
            Join Organization
          </CardTitle>
          <CardDescription>
            You've been invited to join an organization
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Organization Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{invite.organization.name}</h3>
                <p className="text-sm text-muted-foreground">Organization</p>
              </div>
            </div>
          </div>

          {/* Invitation Details */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Role:</span>
              <Badge
                variant={getRoleBadgeVariant(invite.role)}
                className="gap-1"
              >
                {invite.role === "owner" ? (
                  <Crown className="h-3 w-3" />
                ) : (
                  <User className="h-3 w-3" />
                )}
                {invite.role}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Expires:</span>
              <span className="text-sm">{formatDate(invite.expires_at)}</span>
            </div>
          </div>

          {/* Email Check */}
          {invite.email && invite.email !== user?.email && (
            <div className="rounded-lg bg-yellow-50 p-3 border border-yellow-200">
              <p className="text-sm text-yellow-800">
                <strong>Note:</strong> This invitation was sent to{" "}
                <code className="text-xs bg-yellow-100 px-1 py-0.5 rounded">
                  {invite.email}
                </code>{" "}
                but you're logged in as{" "}
                <code className="text-xs bg-yellow-100 px-1 py-0.5 rounded">
                  {user?.email}
                </code>
                . You can still join the organization.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={() => router.push("/dashboard")}
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={handleJoinOrganization}
            disabled={isJoining}
          >
            {isJoining ? "Joining..." : "Join Organization"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}
