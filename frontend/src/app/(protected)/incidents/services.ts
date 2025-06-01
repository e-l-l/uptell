import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  CreateIncidentData,
  CreateIncidentLogData,
  Incident,
  IncidentLog,
  UpdateIncidentData,
} from "./types";
import { apiClient } from "@/lib/api-client";

export const useIncidents = (orgId: string) => {
  return useQuery({
    queryKey: ["incidents", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return apiClient.get<Incident[]>("/incidents", {
        org_id: orgId,
      });
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

export const useCreateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncidentData) => {
      return apiClient.post<Incident>("/incidents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident created successfully");
    },
    onError: () => {
      toast.error("Failed to create incident");
    },
  });
};

export const useUpdateIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateIncidentData;
    }) => {
      return apiClient.patch<Incident>(`/incidents/${id}`, data);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      queryClient.invalidateQueries({
        queryKey: ["incident", variables.id.toString()],
      });
      toast.success("Incident updated successfully");
    },
    onError: () => {
      toast.error("Failed to update incident");
    },
  });
};

export const useDeleteIncident = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/incidents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
      toast.success("Incident deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete incident");
    },
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
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateIncidentLogData) => {
      return apiClient.post<IncidentLog>(
        `/incidents/${data.incident_id}/logs`,
        {
          status: data.status,
          message: data.message,
          org_id: data.org_id,
          time: new Date().toISOString(),
        }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incident-logs", variables.incident_id],
      });
      queryClient.invalidateQueries({
        queryKey: ["incident", variables.incident_id],
      });
      // Also invalidate bulk logs cache
      queryClient.invalidateQueries({
        queryKey: ["bulk-incident-logs"],
      });
      toast.success("Log entry added successfully");
    },
    onError: () => {
      toast.error("Failed to add log entry");
    },
  });
};
