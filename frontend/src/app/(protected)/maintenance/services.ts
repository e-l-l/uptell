import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Maintenance,
  CreateMaintenanceData,
  UpdateMaintenanceData,
} from "./types";
import { apiClient } from "@/lib/api-client";
import { useApiMutation } from "@/hooks/useApiMutation";

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
  return useApiMutation({
    mutationFn: async (data: CreateMaintenanceData) => {
      return apiClient.post<Maintenance>("/maintenance", data);
    },
    successMessage: "Maintenance scheduled successfully",
    invalidateQueries: ["maintenance"],
  });
};

export const useUpdateMaintenance = () => {
  return useApiMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateMaintenanceData;
    }) => {
      return apiClient.patch<Maintenance>(`/maintenance/${id}`, data);
    },
    successMessage: "Maintenance updated successfully",
    invalidateQueries: ["maintenance"],
  });
};

export const useDeleteMaintenance = () => {
  return useApiMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/maintenance/${id}`);
    },
    successMessage: "Maintenance deleted successfully",
    invalidateQueries: ["maintenance"],
  });
};
