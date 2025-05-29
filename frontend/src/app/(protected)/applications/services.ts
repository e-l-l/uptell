import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Application, ApplicationStatus } from "./types";
import { apiClient } from "@/lib/api-client";

interface CreateApplicationData {
  name: string;
  status: ApplicationStatus;
  org_id: string;
}

interface UpdateApplicationData {
  name: string;
  status: ApplicationStatus;
}

export const useApplications = (orgId: string | undefined) => {
  return useQuery({
    queryKey: ["applications", orgId],
    queryFn: async () => {
      if (!orgId) return [];
      return apiClient.get<Application[]>("/applications", { org_id: orgId });
    },
  });
};

export const useCreateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateApplicationData) => {
      return apiClient.post<Application>("/applications", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application created successfully");
    },
    onError: () => {
      toast.error("Failed to create application");
    },
  });
};

export const useUpdateApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateApplicationData;
    }) => {
      return apiClient.patch<Application>(`/applications/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application updated successfully");
    },
    onError: () => {
      toast.error("Failed to update application");
    },
  });
};

export const useDeleteApplication = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/applications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["applications"] });
      toast.success("Application deleted successfully");
    },
    onError: () => {
      toast.error("Failed to delete application");
    },
  });
};
