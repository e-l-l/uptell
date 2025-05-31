import { ApplicationStatus } from "./types";

export const getApplicationStatusColor = (status: ApplicationStatus) => {
  switch (status) {
    case "Operational":
      return "bg-good-bg text-good-fg";
    case "Degraded Performance":
      return "bg-bad-bg text-bad-fg";
    case "Partial Outage":
      return "bg-worse-bg text-worse-fg";
    case "Major Outage":
      return "bg-worst-bg text-worst-fg";
    case "Unknown":
      return "bg-unknown-bg text-unknown-fg";
    default:
      return "bg-unknown-bg text-unknown-fg";
  }
};

export const getAppChartColors = (status: ApplicationStatus) => {
  switch (status) {
    case "Operational":
      return "bg-good-bg-dark text-good-fg-dark";
    case "Degraded Performance":
      return "bg-bad-bg-dark text-bad-fg-dark";
    case "Partial Outage":
      return "bg-worse-bg-dark text-worse-fg-dark";
    case "Major Outage":
      return "bg-worst-bg-dark text-worst-fg-dark";
    case "Unknown":
      return "bg-unknown-bg-dark text-unknown-fg-dark";
    default:
      return "bg-unknown-bg-dark text-unknown-fg-dark";
  }
};
