import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicTimelineEntry } from "@/hooks/usePublicStats";
import {
  Clock,
  AlertTriangle,
  CheckCircle,
  Search,
  Wrench,
} from "lucide-react";

interface PublicIncidentTimelineProps {
  orgId: string;
  timeline: PublicTimelineEntry[];
  isLoading: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "reported":
      return <AlertTriangle className="h-4 w-4 text-red-500" />;
    case "investigating":
      return <Search className="h-4 w-4 text-yellow-500" />;
    case "identified":
      return <Wrench className="h-4 w-4 text-orange-500" />;
    case "fixed":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    default:
      return <Clock className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "reported":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "investigating":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "identified":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "fixed":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return {
    date: date.toLocaleDateString(),
    time: date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
};

export function PublicIncidentTimeline({
  orgId,
  timeline,
  isLoading,
}: PublicIncidentTimelineProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <Skeleton className="h-4 w-4 rounded-full mt-1" />
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-5 w-16" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-3 w-32" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (timeline.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center space-y-2">
            <Clock className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No recent incident activity to display.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Group timeline entries by incident_id
  const groupedTimeline = timeline.reduce((groups, entry) => {
    const incidentId = entry.incident?.id || "no-incident";
    if (!groups[incidentId]) {
      groups[incidentId] = [];
    }
    groups[incidentId].push(entry);
    return groups;
  }, {} as Record<string, PublicTimelineEntry[]>);

  // Sort each group by created_at (most recent first)
  Object.keys(groupedTimeline).forEach((incidentId) => {
    groupedTimeline[incidentId].sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  });

  // Sort groups by the most recent entry in each group
  const sortedGroups = Object.entries(groupedTimeline).sort(
    ([, aEntries], [, bEntries]) => {
      const aMostRecent = new Date(aEntries[0].created_at).getTime();
      const bMostRecent = new Date(bEntries[0].created_at).getTime();
      return bMostRecent - aMostRecent;
    }
  );

  return (
    <div className="space-y-6">
      {sortedGroups.map(([incidentId, entries]) => (
        <div key={incidentId} className="space-y-4">
          {/* Incident header */}
          {incidentId !== "no-incident" && entries[0].incident && (
            <Card className="border-l-4 border-l-primary">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {entries[0].incident.title}
                </CardTitle>
                <CardDescription className="text-sm">
                  Incident Timeline • {entries.length} update
                  {entries.length !== 1 ? "s" : ""}
                </CardDescription>
              </CardHeader>
            </Card>
          )}

          {/* Timeline entries for this incident */}
          <div className="space-y-3 ml-4">
            {entries.map((entry, index) => {
              const { date, time } = formatDate(entry.created_at);
              const isLast = index === entries.length - 1;

              return (
                <Card
                  key={entry.id}
                  className="transition-colors hover:bg-muted/50"
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex flex-col items-center">
                        {getStatusIcon(entry.status)}
                        {!isLast && <div className="w-px h-8 bg-border mt-2" />}
                      </div>

                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{time}</span>
                          <Badge
                            variant="secondary"
                            className={getStatusColor(entry.status)}
                          >
                            {entry.status}
                          </Badge>
                          {entry.application && (
                            <Badge variant="outline" className="text-xs">
                              {entry.application.name}
                            </Badge>
                          )}
                        </div>

                        <p className="text-sm">{entry.message}</p>
                        <div className="text-xs text-muted-foreground">
                          {date}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
