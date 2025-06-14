export type IncidentStatus =
  | "Reported"
  | "Investigating"
  | "Identified"
  | "Fixed";

export interface Incident {
  id: string;
  title: string;
  description: string;
  status: IncidentStatus;
  org_id: string;
  app_id: string;
  time: string;
}

export interface CreateIncidentData {
  title: string;
  description: string;
  app_id: string;
  status: string;
  org_id: string;
}

export interface UpdateIncidentData {
  title?: string;
  description?: string;
  status?: string;
  app_id?: string;
}

export interface IncidentLog {
  id: string;
  incident_id: string;
  org_id: string;
  status: string;
  message: string;
  created_at: Date;
}

export interface CreateIncidentLogData {
  incident_id: string;
  org_id: string;
  status: string;
  message: string;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  total_pages: number;
}

export interface PaginatedIncidentResponse {
  data: Incident[];
  pagination: PaginationMeta;
}
