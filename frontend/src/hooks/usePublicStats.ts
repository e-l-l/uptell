import { useState, useEffect, useCallback } from "react";

export interface PublicOrganization {
  id: string;
  name: string;
}

export interface PublicService {
  id: string;
  name: string;
  status: string;
  org_id: string;
}

export interface PublicIncident {
  id: string;
  title: string;
  description: string;
  status: string;
  time: string;
  org_id: string;
  app_id: string;
}

export interface PublicMaintenance {
  id: string;
  title: string;
  start_time: string;
  end_time: string;
  org_id: string;
  app_id: string;
}

export interface PublicIncidentsSummary {
  active_incidents_count: number;
  active_incidents: PublicIncident[];
  current_maintenance_count: number;
  current_maintenance: PublicMaintenance[];
  next_maintenance: PublicMaintenance | null;
}

export interface PublicTimelineEntry {
  id: string;
  created_at: string;
  status: string;
  message: string;
  org_id: string;
  incident_id: string;
  incident: PublicIncident;
  application: PublicService;
}

export interface PublicStatsOverview {
  organization: PublicOrganization;
  services: PublicService[];
  incidents_summary: PublicIncidentsSummary;
  recent_timeline: PublicTimelineEntry[];
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export function usePublicStats() {
  const [organizations, setOrganizations] = useState<PublicOrganization[]>([]);
  const [statsOverview, setStatsOverview] =
    useState<PublicStatsOverview | null>(null);
  const [isLoadingOrgs, setIsLoadingOrgs] = useState(true);
  const [isLoadingStats, setIsLoadingStats] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch all organizations for the dropdown
  const fetchOrganizations = useCallback(async () => {
    try {
      setIsLoadingOrgs(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/public/organizations`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setOrganizations(data);
    } catch (err) {
      console.error("Failed to fetch organizations:", err);
      setError("Failed to load organizations");
      setOrganizations([]);
    } finally {
      setIsLoadingOrgs(false);
    }
  }, []);

  // Fetch stats overview for a specific organization
  const fetchStatsOverview = useCallback(async (orgId: string) => {
    try {
      setIsLoadingStats(true);
      setError(null);

      const response = await fetch(
        `${API_BASE_URL}/public/stats/${orgId}/overview`
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setStatsOverview(data);
    } catch (err) {
      console.error("Failed to fetch stats overview:", err);
      setError("Failed to load stats data");
      setStatsOverview(null);
    } finally {
      setIsLoadingStats(false);
    }
  }, []);

  // Fetch services for a specific organization
  const fetchServices = useCallback(
    async (orgId: string): Promise<PublicService[]> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/public/stats/${orgId}/services`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        console.error("Failed to fetch services:", err);
        return [];
      }
    },
    []
  );

  // Fetch incidents summary for a specific organization
  const fetchIncidentsSummary = useCallback(
    async (orgId: string): Promise<PublicIncidentsSummary | null> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/public/stats/${orgId}/incidents/summary`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        console.error("Failed to fetch incidents summary:", err);
        return null;
      }
    },
    []
  );

  // Fetch incident timeline for a specific organization
  const fetchIncidentTimeline = useCallback(
    async (orgId: string, limit = 50): Promise<PublicTimelineEntry[]> => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/public/stats/${orgId}/incidents/timeline?limit=${limit}`
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
      } catch (err) {
        console.error("Failed to fetch incident timeline:", err);
        return [];
      }
    },
    []
  );

  // Load organizations on mount
  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    statsOverview,
    isLoadingOrgs,
    isLoadingStats,
    error,
    fetchOrganizations,
    fetchStatsOverview,
    fetchServices,
    fetchIncidentsSummary,
    fetchIncidentTimeline,
  };
}
