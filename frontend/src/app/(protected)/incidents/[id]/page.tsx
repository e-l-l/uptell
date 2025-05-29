"use client";

import React from "react";
import { useParams } from "next/navigation";
import { useIncident, useIncidentLogs } from "../services";
import { useApplications } from "../../applications/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  CalendarIcon,
  ClockIcon,
  AlertCircleIcon,
  InfoIcon,
} from "lucide-react";
import { useAtomValue } from "jotai";
import { currentOrgAtom } from "@/lib/atoms/auth";

const statusColors = {
  Reported: "bg-red-500/10 text-red-700 border-red-200",
  Investigating: "bg-yellow-500/10 text-yellow-700 border-yellow-200",
  Identified: "bg-blue-500/10 text-blue-700 border-blue-200",
  Fixed: "bg-green-500/10 text-green-700 border-green-200",
} as const;

const statusIcons = {
  Reported: AlertCircleIcon,
  Investigating: ClockIcon,
  Identified: InfoIcon,
  Fixed: CheckCircleIcon,
} as const;

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  );
}

export default function IncidentDetailsPage() {
  const params = useParams();
  const incidentId = params.id as string;

  const currentOrg = useAtomValue(currentOrgAtom);
  const {
    data: incident,
    isLoading: incidentLoading,
    error: incidentError,
  } = useIncident(incidentId);
  const { data: logs = [], isLoading: logsLoading } =
    useIncidentLogs(incidentId);
  const { data: applications = [] } = useApplications(currentOrg?.id);

  // Find the application name based on app_id
  const applicationName =
    applications.find((app) => app.id === incident?.app_id)?.name ||
    incident?.app_id;

  if (incidentLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (incidentError || !incident) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              Failed to load incident details
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusIcons[incident.status as keyof typeof statusIcons];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            {incident.title}
          </h1>
          <p className="text-muted-foreground mt-1">Incident #{incident.id}</p>
        </div>
        <Badge
          className={`px-3 py-1 ${
            statusColors[incident.status as keyof typeof statusColors]
          }`}
        >
          <StatusIcon className="w-4 h-4 mr-2" />
          {incident.status}
        </Badge>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Incident details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <InfoIcon className="w-5 h-5 mr-2" />
                Incident Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Description
                </h4>
                <p className="text-muted-foreground leading-relaxed">
                  {incident.description}
                </p>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Application
                  </h4>
                  <p className="text-muted-foreground">{applicationName}</p>
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Organization
                  </h4>
                  <p className="text-muted-foreground">
                    {currentOrg?.name || "Unknown Organization"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Created At
                </h4>
                <p className="text-muted-foreground">
                  {new Date(incident.time).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right column - Timeline */}
        <div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {logsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No activity logs yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .map((log, index) => {
                        const LogStatusIcon =
                          statusIcons[log.status as keyof typeof statusIcons];
                        return (
                          <div key={log.id} className="relative">
                            {/* Timeline line */}
                            {index !== logs.length - 1 && (
                              <div className="absolute left-3 top-8 w-0.5 h-full bg-border" />
                            )}

                            {/* Timeline item */}
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${
                                  statusColors[
                                    log.status as keyof typeof statusColors
                                  ]
                                } border-2`}
                              >
                                <LogStatusIcon className="w-3 h-3" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${
                                      statusColors[
                                        log.status as keyof typeof statusColors
                                      ]
                                    }`}
                                  >
                                    {log.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      log.created_at
                                    ).toLocaleDateString()}{" "}
                                    {new Date(
                                      log.created_at
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>

                                <p className="text-sm text-foreground mt-1 leading-relaxed">
                                  {log.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
