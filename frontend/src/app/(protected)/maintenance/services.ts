import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Maintenance,
  CreateMaintenanceData,
  UpdateMaintenanceData,
} from "./types";
import { apiClient } from "@/lib/api-client";

export const useMaintenance = (orgId: string) => {
  return useQuery({
    queryKey: ["maintenance", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return apiClient.get<Maintenance[]>("/maintenance", {
        org_id: orgId,
      });
    },
    enabled: !!orgId,
    // Maintenance doesn't change frequently
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useMaintenanceByApp = (appId: string) => {
  return useQuery({
    queryKey: ["maintenance", "app", appId],
    queryFn: async () => {
      if (!appId) return [];
      return apiClient.get<Maintenance[]>(`/maintenance/app/${appId}`);
    },
    enabled: !!appId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCreateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateMaintenanceData) => {
      return apiClient.post<Maintenance>("/maintenance", data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["maintenance", variables.org_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["maintenance", "app", variables.app_id],
      });
      toast.success("Maintenance scheduled successfully");
    },
    onError: () => {
      toast.error("Failed to schedule maintenance");
    },
  });
};

export const useUpdateMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaintenanceData;
    }) => {
      return apiClient.patch<Maintenance>(`/maintenance/${id}`, data);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({
        queryKey: ["maintenance"],
      });
      toast.success("Maintenance updated successfully");
    },
    onError: () => {
      toast.error("Failed to update maintenance");
    },
  });
};

export const useDeleteMaintenance = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/maintenance/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["maintenance"],
      });
      toast.success("Maintenance deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete maintenance");
    },
  });
};
