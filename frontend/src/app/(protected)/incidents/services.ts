import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Incident } from "./types";
import { apiClient } from "@/lib/api-client";

interface CreateIncidentData {
  title: string;
  description: string;
  application_id: number;
  status: string;
}

interface UpdateIncidentData {
  title?: string;
  description?: string;
  status?: string;
}

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
    mutationFn: async (id: number) => {
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
