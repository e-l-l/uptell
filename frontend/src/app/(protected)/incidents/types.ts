export type IncidentStatus =
  | "Reported"
  | "Investigating"
  | "Identified"
  | "Fixed";

export interface Incident {
  id: string;
  name: string;
  description: string;
  status: IncidentStatus;
  org_id: string;
  app_id: string;
  time: string;
}
