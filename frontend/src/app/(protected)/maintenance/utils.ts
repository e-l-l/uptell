import { format, isAfter, isBefore } from "date-fns";
import { Maintenance } from "./types";

export const formatMaintenanceDate = (dateString: string) => {
  return format(new Date(dateString), "MMM dd, yyyy HH:mm");
};

export const getMaintenanceStatus = (maintenance: Maintenance) => {
  const now = new Date();
  const startTime = new Date(maintenance.start_time);
  const endTime = new Date(maintenance.end_time);

  if (isBefore(now, startTime)) {
    return "Scheduled";
  } else if (isAfter(now, startTime) && isBefore(now, endTime)) {
    return "In Progress";
  } else {
    return "Completed";
  }
};

export const getMaintenanceStatusColor = (status: string) => {
  switch (status) {
    case "Scheduled":
      return "bg-bad-bg text-bad-fg";
    case "In Progress":
      return "bg-worse-bg text-worse-fg";
    case "Completed":
      return "bg-good-bg text-good-fg";
    default:
      return "bg-unknown-bg text-unknown-fg";
  }
};
