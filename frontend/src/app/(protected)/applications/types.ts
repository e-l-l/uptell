export type ApplicationStatus =
  | "Operational"
  | "Degraded Performance"
  | "Partial Outage"
  | "Major Outage"
  | "Unknown";

export interface Application {
  id: string;
  name: string;
  status: ApplicationStatus;
  org_id: string;
  created_at: string;
  updated_at: string;
}
