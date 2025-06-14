import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { AlertTriangle } from "lucide-react";
import { Incident } from "@/app/(protected)/incidents/types";
import {
  Application,
  ApplicationStatus,
} from "@/app/(protected)/applications/types";
import { getApplicationStatusColor } from "@/app/(protected)/applications/utils";

interface TopAffectedAppsProps {
  incidents: Incident[];
  applications: Application[];
  isLoading: boolean;
}

export function TopAffectedApps({
  incidents,
  applications,
  isLoading,
}: TopAffectedAppsProps) {
  // Count incidents per app
  const appIncidentCounts = React.useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((incident) => {
      // Only count incidents that are not Fixed
      if (incident.status !== "Fixed") {
        counts[incident.app_id] = (counts[incident.app_id] || 0) + 1;
      }
    });

    // Convert to array and sort by count
    return Object.entries(counts)
      .map(([appId, count]) => ({
        appId,
        count,
        appName:
          applications.find((app) => app.id === appId)?.name || `App ${appId}`,
        appStatus:
          applications.find((app) => app.id === appId)?.status || "Unknown",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5); // Top 5 apps
  }, [incidents, applications]);

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Top Affected Apps (By Incidents)
        </CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold">...</div>
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : appIncidentCounts.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-sm text-muted-foreground">No Active incidents found</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="text-2xl font-bold">
              {appIncidentCounts[0]?.count || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Incidents on {appIncidentCounts[0]?.appName || "top app"}
            </p>
            <div className="space-y-2">
              {appIncidentCounts.map((app, index) => (
                <div
                  key={app.appId}
                  className="flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">#{index + 1}</span>
                    <span
                      className="text-sm truncate max-w-[120px]"
                      title={app.appName}
                    >
                      {app.appName}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-xs">
                      {app.count}
                    </Badge>
                    <Badge
                      className={`text-xs ${getApplicationStatusColor(
                        app.appStatus as ApplicationStatus
                      )}`}
                    >
                      {app.appStatus}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
