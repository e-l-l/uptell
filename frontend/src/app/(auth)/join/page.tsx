"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useAtom } from "jotai";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { apiClient } from "@/lib/api-client";
import { isAuthenticatedAtom, userAtom } from "@/lib/atoms/auth";

export default function JoinOrganizationPage() {
  const router = useRouter();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [user] = useAtom(userAtom);
  const [inviteCode, setInviteCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!user?.id) {
      setError("User not found");
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.joinOrganization(inviteCode);
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to join organization");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg border border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-[#8a8f98] bg-clip-text text-transparent">
          Join Organization
        </CardTitle>
        <CardDescription>Enter your organization invite code</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            {error && (
              <div className="text-sm text-red-500 text-left">{error}</div>
            )}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="inviteCode">Invite Code</Label>
              <Input
                id="inviteCode"
                type="text"
                placeholder="Enter your invite code"
                className="border-border"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value)}
                required
              />
            </div>
          </div>
          <CardFooter className="flex flex-col gap-4 px-0 pt-6">
            <Button
              type="submit"
              className="w-full text-background"
              disabled={isLoading}
            >
              {isLoading ? "Joining..." : "Join Organization"}
            </Button>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}
