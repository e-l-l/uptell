import {
  useMutation,
  useQueryClient,
  UseMutationOptions,
  UseMutationResult,
} from "@tanstack/react-query";
import { toast } from "sonner";

interface ApiMutationOptions<TData, TError, TVariables, TContext>
  extends Omit<
    UseMutationOptions<TData, TError, TVariables, TContext>,
    "onSuccess" | "onError"
  > {
  successMessage?: string | ((data: TData, variables: TVariables) => string);
  errorMessage?: string | ((error: TError, variables: TVariables) => string);
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
  invalidateQueries?: string[] | string[][];
  onSuccess?: (data: TData, variables: TVariables, context?: TContext) => void;
  onError?: (error: TError, variables: TVariables, context?: TContext) => void;
}

export function useApiMutation<
  TData = unknown,
  TError = Error,
  TVariables = void,
  TContext = unknown
>(
  options: ApiMutationOptions<TData, TError, TVariables, TContext>
): UseMutationResult<TData, TError, TVariables, TContext> {
  const queryClient = useQueryClient();

  const {
    successMessage,
    errorMessage,
    showSuccessToast = true,
    showErrorToast = false, // Don't show error toast by default since API client handles this
    invalidateQueries = [],
    onSuccess,
    onError,
    ...mutationOptions
  } = options;

  return useMutation({
    ...mutationOptions,
    onSuccess: (data, variables, context) => {
      // Show success toast
      if (showSuccessToast && successMessage) {
        const message =
          typeof successMessage === "function"
            ? successMessage(data, variables)
            : successMessage;
        toast.success(message);
      }

      // Invalidate specified queries
      if (invalidateQueries.length > 0) {
        invalidateQueries.forEach((queryKey) => {
          queryClient.invalidateQueries({
            queryKey: Array.isArray(queryKey) ? queryKey : [queryKey],
          });
        });
      }

      // Call custom success handler
      if (onSuccess) {
        onSuccess(data, variables, context);
      }
    },
    onError: (error, variables, context) => {
      // Show error toast only if explicitly enabled (since API client handles most errors)
      if (showErrorToast && errorMessage) {
        const message =
          typeof errorMessage === "function"
            ? errorMessage(error, variables)
            : errorMessage;
        toast.error(message);
      }

      // Call custom error handler
      if (onError) {
        onError(error, variables, context);
      }
    },
  });
}

// Convenience hooks for common operations
export function useCreateMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<
    ApiMutationOptions<TData, Error, TVariables, unknown>,
    "mutationFn"
  > = {}
) {
  return useApiMutation({
    mutationFn,
    successMessage: "Created successfully",
    ...options,
  });
}

export function useUpdateMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<
    ApiMutationOptions<TData, Error, TVariables, unknown>,
    "mutationFn"
  > = {}
) {
  return useApiMutation({
    mutationFn,
    successMessage: "Updated successfully",
    ...options,
  });
}

export function useDeleteMutation<TData = unknown, TVariables = void>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: Omit<
    ApiMutationOptions<TData, Error, TVariables, unknown>,
    "mutationFn"
  > = {}
) {
  return useApiMutation({
    mutationFn,
    successMessage: "Deleted successfully",
    ...options,
  });
}
