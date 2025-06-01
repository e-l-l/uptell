"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useApiError } from "@/hooks/useApiError";
import { useApiMutation } from "@/hooks/useApiMutation";
import { toast } from "sonner";

export function ErrorDemo() {
  const { handleError, showErrorToast } = useApiError();

  // Demo mutation that always fails
  const failingMutation = useApiMutation({
    mutationFn: async () => {
      throw new Error("This is a demo error from a mutation");
    },
    successMessage: "This won't show",
    showErrorToast: true, // Enable error toast for this demo
    errorMessage: "Custom error message from mutation",
  });

  // Demo mutation that succeeds
  const successMutation = useApiMutation({
    mutationFn: async () => {
      return { message: "Success!" };
    },
    successMessage: "Operation completed successfully!",
  });

  const handleManualError = () => {
    handleError(new Error("This is a manually triggered error"), {
      customMessage: "Something went wrong with manual handling",
      toastType: "error",
    });
  };

  const handleWarningToast = () => {
    showErrorToast("This is a warning message", "warning");
  };

  const handleInfoToast = () => {
    showErrorToast("This is an info message", "info");
  };

  const handleNetworkError = () => {
    // Simulate a network error
    fetch("https://nonexistent-api.example.com/test").catch((error) => {
      handleError(error, {
        customMessage: "Failed to connect to external service",
      });
    });
  };

  const handleSuccessToast = () => {
    toast.success("This is a success message!");
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Error Handling Demo</CardTitle>
        <CardDescription>
          Test different types of error handling and toast notifications
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Button
            onClick={() => failingMutation.mutate()}
            disabled={failingMutation.isPending}
            variant="destructive"
          >
            {failingMutation.isPending
              ? "Loading..."
              : "Trigger Mutation Error"}
          </Button>

          <Button
            onClick={() => successMutation.mutate()}
            disabled={successMutation.isPending}
            variant="default"
          >
            {successMutation.isPending ? "Loading..." : "Trigger Success"}
          </Button>

          <Button onClick={handleManualError} variant="outline">
            Manual Error
          </Button>

          <Button onClick={handleWarningToast} variant="outline">
            Warning Toast
          </Button>

          <Button onClick={handleInfoToast} variant="outline">
            Info Toast
          </Button>

          <Button onClick={handleSuccessToast} variant="outline">
            Success Toast
          </Button>

          <Button onClick={handleNetworkError} variant="outline">
            Network Error
          </Button>
        </div>

        <div className="mt-6 p-4 bg-muted rounded-lg">
          <h4 className="font-semibold mb-2">Error Handling Features:</h4>
          <ul className="text-sm space-y-1 text-muted-foreground">
            <li>• Global API error handling with automatic toasts</li>
            <li>• Custom error messages and toast types</li>
            <li>• React Query mutation error handling</li>
            <li>• Network error detection</li>
            <li>• Success notifications</li>
            <li>• Error boundary for JavaScript errors</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}
