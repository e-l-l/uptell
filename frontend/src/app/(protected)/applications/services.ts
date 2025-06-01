import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Application, ApplicationStatus } from "./types";
import { apiClient } from "@/lib/api-client";
import { AppHistoryData } from "@/components/dashboard/types";

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
      const applications = await apiClient.get<Application[]>("/applications", {
        org_id: orgId,
      });
      return applications.sort((a, b) => a.name.localeCompare(b.name));
    },
    enabled: !!orgId,
    // Increase staleTime for applications since they don't change frequently
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Optimized bulk application history fetcher
export const useApplicationsHistory = (
  applicationIds: string[],
  timeRange?: { start?: Date; end?: Date }
) => {
  return useQuery({
    queryKey: [
      "applications-history",
      applicationIds,
      timeRange?.start?.toISOString(),
      timeRange?.end?.toISOString(),
    ],
    queryFn: async () => {
      if (applicationIds.length === 0) return {};

      // Fetch history for all applications in parallel
      const historyPromises = applicationIds.map(async (appId) => {
        try {
          const params = new URLSearchParams();
          if (timeRange?.start)
            params.append("start_time", timeRange.start.toISOString());
          if (timeRange?.end)
            params.append("end_time", timeRange.end.toISOString());

          const response = await apiClient.get<AppHistoryData[]>(
            `/applications/${appId}/history?${params}`
          );
          return { [appId]: response };
        } catch (error) {
          console.error(`Failed to fetch history for app ${appId}:`, error);
          return { [appId]: [] };
        }
      });

      const results = await Promise.all(historyPromises);
      return results.reduce((acc, result) => ({ ...acc, ...result }), {});
    },
    enabled: applicationIds.length > 0,
    staleTime: 3 * 60 * 1000, // 3 minutes for history data
  });
};

// Individual application history hook for compatibility
export const useApplicationHistory = (
  appId: string,
  timeRange?: { start?: Date; end?: Date }
) => {
  return useQuery({
    queryKey: [
      "application-history",
      appId,
      timeRange?.start?.toISOString(),
      timeRange?.end?.toISOString(),
    ],
    queryFn: async () => {
      if (!appId) return [];

      const params = new URLSearchParams();
      if (timeRange?.start)
        params.append("start_time", timeRange.start.toISOString());
      if (timeRange?.end)
        params.append("end_time", timeRange.end.toISOString());

      const response = await apiClient.get<AppHistoryData[]>(
        `/applications/${appId}/history?${params}`
      );
      return response;
    },
    enabled: !!appId,
    staleTime: 3 * 60 * 1000, // 3 minutes
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
