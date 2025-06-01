import { useCallback } from "react";
import { toast } from "sonner";

interface ApiErrorOptions {
  showToast?: boolean;
  customMessage?: string;
  toastType?: "error" | "warning" | "info";
  onError?: (error: Error) => void;
}

interface ApiErrorReturn {
  handleError: (error: unknown, options?: ApiErrorOptions) => void;
  showErrorToast: (
    message: string,
    type?: "error" | "warning" | "info"
  ) => void;
}

export function useApiError(): ApiErrorReturn {
  const handleError = useCallback(
    (error: unknown, options: ApiErrorOptions = {}) => {
      const {
        showToast = true,
        customMessage,
        toastType = "error",
        onError,
      } = options;

      let errorMessage = "An unexpected error occurred";

      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === "string") {
        errorMessage = error;
      }

      // Call custom error handler if provided
      if (onError) {
        onError(error instanceof Error ? error : new Error(errorMessage));
      }

      // Show toast if enabled
      if (showToast) {
        const message = customMessage || errorMessage;

        switch (toastType) {
          case "error":
            toast.error(message);
            break;
          case "warning":
            toast.warning(message);
            break;
          case "info":
            toast.info(message);
            break;
          default:
            toast.error(message);
        }
      }

      // Log error for debugging
      console.error("API Error handled:", {
        error,
        message: errorMessage,
        customMessage,
        showToast,
        toastType,
      });
    },
    []
  );

  const showErrorToast = useCallback(
    (message: string, type: "error" | "warning" | "info" = "error") => {
      switch (type) {
        case "error":
          toast.error(message);
          break;
        case "warning":
          toast.warning(message);
          break;
        case "info":
          toast.info(message);
          break;
      }
    },
    []
  );

  return {
    handleError,
    showErrorToast,
  };
}

// Utility function for creating error handlers with default options
export function createErrorHandler(defaultOptions: ApiErrorOptions = {}) {
  return (error: unknown, options: ApiErrorOptions = {}) => {
    const mergedOptions = { ...defaultOptions, ...options };
    const { handleError } = useApiError();
    handleError(error, mergedOptions);
  };
}

// Common error scenarios
export const ErrorScenarios = {
  NETWORK_ERROR:
    "Unable to connect to the server. Please check your internet connection.",
  VALIDATION_ERROR: "Please check your input and try again.",
  PERMISSION_ERROR: "You don't have permission to perform this action.",
  NOT_FOUND_ERROR: "The requested resource was not found.",
  SERVER_ERROR: "A server error occurred. Please try again later.",
  TIMEOUT_ERROR: "The request timed out. Please try again.",
} as const;
