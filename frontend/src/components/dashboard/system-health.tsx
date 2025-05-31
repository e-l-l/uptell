import React from "react";
import { CardContent, CardHeader, CardTitle } from "../ui/card";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { HeartPulse } from "lucide-react";
const SystemHealthCard = ({
  applicationsLoading,
  operationalApps,
  totalApplications,
}: {
  applicationsLoading: boolean;
  operationalApps: number;
  totalApplications: number;
}) => {
  const systemHealthPercentage =
    totalApplications > 0
      ? Math.round((operationalApps / totalApplications) * 100)
      : 100;

  const systemHealthStatus =
    systemHealthPercentage >= 90
      ? "Healthy"
      : systemHealthPercentage >= 70
      ? "Warning"
      : "Critical";
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">System Health</CardTitle>
        <HeartPulse className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-2">
          <div className="text-2xl font-bold">
            {applicationsLoading ? "..." : `${systemHealthPercentage}%`}
          </div>
          <Badge
            variant="default"
            className={
              systemHealthStatus === "Healthy"
                ? "bg-green-100 text-green-800 hover:bg-green-100"
                : systemHealthStatus === "Warning"
                ? "bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
                : "bg-red-100 text-red-800 hover:bg-red-100"
            }
          >
            {systemHealthStatus}
          </Badge>
        </div>
        <p className="text-xs text-muted-foreground">
          {operationalApps} of {totalApplications} apps operational
        </p>
      </CardContent>
    </Card>
  );
};

export default SystemHealthCard;
