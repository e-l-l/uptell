"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, Suspense } from "react";
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
import { Eye, EyeOff } from "lucide-react";
import { isAuthenticatedAtom } from "@/lib/atoms/auth";

function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthenticated] = useAtom(isAuthenticatedAtom);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const redirectTo = searchParams.get("redirect");

  useEffect(() => {
    if (isAuthenticated) {
      router.push(redirectTo || "/dashboard");
    }
  }, [isAuthenticated, router, redirectTo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.signUp(formData.email, formData.password, {
        firstName: formData.firstName,
        lastName: formData.lastName,
      });
      // Redirect to login with the redirect parameter if present
      const loginUrl = redirectTo
        ? `/login?redirect=${encodeURIComponent(redirectTo)}`
        : "/login";
      router.push(loginUrl);
    } catch (err: any) {
      setError(err.message || "Failed to create account");
    } finally {
      setIsLoading(false);
    }
  };

  // Construct login link with redirect parameter if present
  const loginLink = redirectTo
    ? `/login?redirect=${encodeURIComponent(redirectTo)}`
    : "/login";

  return (
    <Card className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg border border-border">
      <CardHeader>
        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-[#8a8f98] bg-clip-text text-transparent">
          Create an account
        </CardTitle>
        <CardDescription>Sign up to get started with Uptell</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit}>
          <div className="grid w-full items-center gap-4">
            {error && (
              <div className="text-sm text-red-500 text-left">{error}</div>
            )}
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                type="text"
                placeholder="Enter your first name"
                className="border-border"
                value={formData.firstName}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                type="text"
                placeholder="Enter your last name"
                className="border-border"
                value={formData.lastName}
                onChange={handleChange}
              />
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                className="border-border"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            <div className="flex flex-col space-y-1.5 mt-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  className="border-border pr-10"
                  value={formData.password}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-col space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  className="border-border pr-10"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <CardFooter className="flex flex-col gap-4 px-0 pt-6">
            <Button
              type="submit"
              className="w-full text-background"
              disabled={isLoading}
            >
              {isLoading ? "Creating account..." : "Create account"}
            </Button>
            <p className="text-sm text-foreground text-center">
              Already have an account?{" "}
              <Link
                href={loginLink}
                className="text-primary hover:underline font-bold"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </CardContent>
    </Card>
  );
}

export default function SignUpPage() {
  return (
    <Suspense
      fallback={
        <Card className="w-full max-w-md p-8 bg-card rounded-lg shadow-lg border border-border">
          <CardHeader>
            <CardTitle className="text-2xl font-bold bg-gradient-to-r from-foreground to-[#8a8f98] bg-clip-text text-transparent">
              Create an account
            </CardTitle>
            <CardDescription>Loading...</CardDescription>
          </CardHeader>
        </Card>
      }
    >
      <SignUpForm />
    </Suspense>
  );
}
