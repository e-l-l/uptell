import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo } from "react";
import { Application, ApplicationStatus } from "./types";
import { apiClient } from "@/lib/api-client";
import { AppHistoryData } from "@/components/dashboard/types";
import { useApiMutation } from "@/hooks/useApiMutation";

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
  // Create stable query key for bulk operations
  const stableQueryKey = useMemo(() => {
    const sortedIds = [...applicationIds].sort(); // Sort for consistent keys
    const startKey = timeRange?.start
      ? new Date(
          timeRange.start.getFullYear(),
          timeRange.start.getMonth(),
          timeRange.start.getDate()
        ).toISOString()
      : null;
    const endKey = timeRange?.end
      ? new Date(
          timeRange.end.getFullYear(),
          timeRange.end.getMonth(),
          timeRange.end.getDate(),
          timeRange.end.getHours()
        ).toISOString()
      : null;

    return ["applications-history", sortedIds, startKey, endKey];
  }, [applicationIds, timeRange?.start, timeRange?.end]);

  return useQuery({
    queryKey: stableQueryKey,
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
    staleTime: 15 * 60 * 1000, // 15 minutes for better dashboard performance
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
  });
};

// Individual application history hook for compatibility
export const useApplicationHistory = (
  appId: string,
  timeRange?: { start?: Date; end?: Date }
) => {
  // Create stable query key by rounding times to reduce cache misses
  const stableQueryKey = useMemo(() => {
    // Round start time to the nearest hour and end time to current hour
    // This creates more stable cache keys for dashboard usage
    const startKey = timeRange?.start
      ? new Date(
          timeRange.start.getFullYear(),
          timeRange.start.getMonth(),
          timeRange.start.getDate()
        ).toISOString()
      : null;
    const endKey = timeRange?.end
      ? new Date(
          timeRange.end.getFullYear(),
          timeRange.end.getMonth(),
          timeRange.end.getDate(),
          timeRange.end.getHours()
        ).toISOString()
      : null;

    return ["application-history", appId, startKey, endKey];
  }, [appId, timeRange?.start, timeRange?.end]);

  return useQuery({
    queryKey: stableQueryKey,
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
    staleTime: 15 * 60 * 1000, // 15 minutes - longer cache for dashboard performance
    gcTime: 30 * 60 * 1000, // 30 minutes garbage collection time
  });
};

export const useCreateApplication = () => {
  return useApiMutation({
    mutationFn: async (data: CreateApplicationData) => {
      return apiClient.post<Application>("/applications", data);
    },
    successMessage: "Application created successfully",
    invalidateQueries: ["applications"],
  });
};

export const useUpdateApplication = () => {
  return useApiMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: UpdateApplicationData;
    }) => {
      return apiClient.patch<Application>(`/applications/${id}`, data);
    },
    successMessage: "Application updated successfully",
    invalidateQueries: ["applications"],
  });
};

export const useDeleteApplication = () => {
  return useApiMutation({
    mutationFn: async (id: string) => {
      return apiClient.delete(`/applications/${id}`);
    },
    successMessage: "Application deleted successfully",
    invalidateQueries: ["applications"],
  });
};
