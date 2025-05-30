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
  });
};

export const useIncident = (incidentId: string) => {
  return useQuery({
    queryKey: ["incident", incidentId],
    queryFn: async () => {
      return apiClient.get<Incident>(`/incidents/${incidentId}`);
    },
    enabled: !!incidentId,
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
      id: number;
      data: UpdateIncidentData;
    }) => {
      return apiClient.patch<Incident>(`/incidents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["incidents"] });
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
          time: new Date().toISOString(),
        }
      );
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["incident-logs", variables.incident_id],
      });
      toast.success("Log entry added successfully");
    },
    onError: () => {
      toast.error("Failed to add log entry");
    },
  });
};
