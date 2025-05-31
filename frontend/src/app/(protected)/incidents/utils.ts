import { IncidentStatus } from "./types";

export const getIncidentStatusColor = (status: IncidentStatus) => {
  switch (status) {
    case "Reported":
      return "bg-worst-bg text-worst-fg";
    case "Investigating":
      return "bg-worse-bg text-worse-fg";
    case "Identified":
      return "bg-bad-bg text-bad-fg";
    case "Fixed":
      return "bg-good-bg text-good-fg";
    default:
      return "bg-unknown-bg text-unknown-fg";
  }
};
