export interface Maintenance {
  id: string;
  app_id: string;
  org_id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export interface CreateMaintenanceData {
  app_id: string;
  org_id: string;
  title: string;
  start_time: string;
  end_time: string;
}

export interface UpdateMaintenanceData {
  title?: string;
  start_time?: string;
  end_time?: string;
}
