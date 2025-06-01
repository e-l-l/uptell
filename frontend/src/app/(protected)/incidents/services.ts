import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CreateIncidentData,
  CreateIncidentLogData,
  Incident,
  IncidentLog,
  UpdateIncidentData,
  PaginatedIncidentResponse,
} from "./types";
import { apiClient } from "@/lib/api-client";
import { useApiMutation } from "@/hooks/useApiMutation";

export const useIncidents = (
  orgId: string,
  page: number = 1,
  limit: number = 10,
  appId?: string
) => {
  return useQuery({
    queryKey: ["incidents", orgId, page, limit, appId],
    queryFn: async () => {
      if (!orgId)
        return {
          data: [],
          pagination: { total: 0, page: 1, limit: 10, total_pages: 1 },
        };

      const params: any = {
        org_id: orgId,
        page,
        limit,
      };

      if (appId) {
        params.app_id = appId;
      }

      return apiClient.get<PaginatedIncidentResponse>("/incidents", params);
    },
    enabled: !!orgId,
    // Incidents change more frequently, shorter stale time
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useIncident = (incidentId: string) => {
  return useQuery({
    queryKey: ["incident", incidentId],
    queryFn: async () => {
      return apiClient.get<Incident>(`/incidents/${incidentId}`);
    },
    enabled: !!incidentId,
    staleTime: 1 * 60 * 1000, // 1 minute for individual incidents
  });
};

// Bulk incident logs fetcher for analytics optimization
export const useBulkIncidentLogs = (incidentIds: string[]) => {
  return useQuery({
    queryKey: ["bulk-incident-logs", incidentIds.sort()], // Sort for consistent cache key
    queryFn: async () => {
      if (incidentIds.length === 0) return {};

      // Fetch logs for all incidents in parallel
      const logsPromises = incidentIds.map(async (incidentId) => {
        try {
          const logs = await apiClient.get<IncidentLog[]>(
            `/incidents/${incidentId}/logs`
          );
          return { [incidentId]: logs };
        } catch (error) {
          console.error(
            `Failed to fetch logs for incident ${incidentId}:`,
            error
          );
          return { [incidentId]: [] };
        }
      });

      const results = await Promise.all(logsPromises);
      return results.reduce((acc, result) => ({ ...acc, ...result }), {});
    },
    enabled: incidentIds.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes for logs
  });
};

// Organization-based bulk logs fetcher - much more efficient for dashboard analytics
export const useOrgIncidentLogs = (orgId: string) => {
  return useQuery({
    queryKey: ["org-incident-logs", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return apiClient.get<IncidentLog[]>(`/incidents/0/logs/org/${orgId}`);
    },
    enabled: !!orgId,
    staleTime: 3 * 60 * 1000, // 3 minutes for logs
  });
};

export const useCreateIncident = () => {
  return useApiMutation({
    mutationFn: async (data: CreateIncidentData) => {
      return apiClient.post<Incident>("/incidents", data);
    },
    successMessage: "Incident created successfully",
    invalidateQueries: ["incidents"],
  });
};

export const useUpdateIncident = () => {
  return useApiMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateIncidentData;
    }) => {
      return apiClient.patch<Incident>(`/incidents/${id}`, data);
    },
    successMessage: "Incident updated successfully",
    invalidateQueries: [["incidents"], ["incident"]],
  });
};

export const useDeleteIncident = () => {
  return useApiMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/incidents/${id}`);
    },
    successMessage: "Incident deleted successfully",
    invalidateQueries: ["incidents"],
  });
};

// Logs
export const useIncidentLogs = (incidentId: string) => {
  return useQuery({
    queryKey: ["incident-logs", incidentId],
    queryFn: async () => {
      return apiClient.get<IncidentLog[]>(`/incidents/${incidentId}/logs`);
    },
    enabled: !!incidentId,
    staleTime: 3 * 60 * 1000, // 30 seconds for logs (more real-time)
  });
};

export const useCreateIncidentLog = () => {
  return useApiMutation({
    mutationFn: async (data: CreateIncidentLogData) => {
      const { incident_id, ...bodyData } = data;
      return apiClient.post<IncidentLog>(
        `/incidents/${incident_id}/logs`,
        bodyData
      );
    },
    successMessage: "Incident log created successfully",
    invalidateQueries: [["incident-logs"], ["incidents"], ["incident"]],
  });
};
