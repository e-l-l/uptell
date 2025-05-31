import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { Calendar, Clock } from "lucide-react";
import {
  formatMaintenanceDate,
  getMaintenanceStatus,
} from "@/app/(protected)/maintenance/utils";
import { Maintenance } from "@/app/(protected)/maintenance/types";

const NextMaintenanceCard = ({
  maintenanceLoading,
  nextMaintenance,
}: {
  maintenanceLoading: boolean;
  nextMaintenance: Maintenance | null;
}) => {
  const getDisplayContent = () => {
    if (maintenanceLoading) {
      return {
        title: "...",
        subtitle: "Loading...",
      };
    }

    if (!nextMaintenance) {
      return {
        title: "None",
        subtitle: "No upcoming maintenance",
      };
    }

    const status = getMaintenanceStatus(nextMaintenance);
    if (status === "In Progress") {
      return {
        title: "In Progress",
        subtitle: nextMaintenance.title,
      };
    }

    return {
      title: formatMaintenanceDate(nextMaintenance.start_time),
      subtitle: nextMaintenance.title,
    };
  };

  const { title, subtitle } = getDisplayContent();

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Next Scheduled Maintenance
        </CardTitle>
        {nextMaintenance &&
        getMaintenanceStatus(nextMaintenance) === "In Progress" ? (
          <Clock className="h-4 w-4 text-orange-500" />
        ) : (
          <Calendar className="h-4 w-4 text-muted-foreground" />
        )}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold truncate" title={title}>
          {title}
        </div>
        <p className="text-xs text-muted-foreground truncate" title={subtitle}>
          {subtitle}
        </p>
      </CardContent>
    </Card>
  );
};

export default NextMaintenanceCard;
