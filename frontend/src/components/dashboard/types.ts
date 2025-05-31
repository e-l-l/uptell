import { Application } from "@/app/(protected)/applications/types";

export interface AppHistoryData {
  id: string;
  app_id: string;
  status: string;
  recorded_at: string;
}

export interface AppHistoryProps {
  app: Application;
}
