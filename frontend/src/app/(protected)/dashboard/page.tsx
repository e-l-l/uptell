"use client";

import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApplications } from "@/app/(protected)/applications/services";
import { useIncidents } from "@/app/(protected)/incidents/services";
import { AppHistory } from "@/components/dashboard/app-history";
import { useAtom } from "jotai";
import { currentOrgAtom } from "@/lib/atoms/auth";
import TotalAppsCard from "@/components/dashboard/total-apps";
import UnfixedIncidentsCard from "@/components/dashboard/unfixed-incidents";
import SystemHealthCard from "@/components/dashboard/system-health";
import { AlertTriangle, Computer } from "lucide-react";

export default function DashboardPage() {
  const [currentOrg] = useAtom(currentOrgAtom);

  // Fetch real data
  const { data: applications = [], isLoading: applicationsLoading } =
    useApplications(currentOrg?.id);
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents(
    currentOrg?.id || ""
  );

  // Calculate metrics from real data
  const totalApplications = applications.length;
  const unfixedIncidents = incidents.filter(
    (incident) => incident.status !== "Fixed"
  ).length;

  // Calculate system health based on applications with operational status
  const operationalApps = applications.filter(
    (app) =>
      app.status === "Operational" ||
      app.status === "Degraded Performance" ||
      app.status === "Partial Outage"
  ).length;

  return (
    <div className="flex flex-1 flex-col gap-6 p-6">
      {/* Header */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground">
          View your system overview and key metrics.
        </p>
      </div>

      {/* Overview Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Overview</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Applications Card */}
          <TotalAppsCard
            applicationsLoading={applicationsLoading}
            totalApplications={totalApplications}
          />

          {/* Unfixed Incidents Card */}
          <UnfixedIncidentsCard
            incidentsLoading={incidentsLoading}
            unfixedIncidents={unfixedIncidents}
          />

          {/* System Health Card */}
          <SystemHealthCard
            applicationsLoading={applicationsLoading}
            operationalApps={operationalApps}
            totalApplications={totalApplications}
          />
        </div>
      </section>

      <Separator />

      {/* Applications Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Applications</h2>
          <Badge variant="secondary">{applications.length} apps</Badge>
        </div>

        {/* Application History Components */}
        <div className="space-y-4">
          {applications.length > 0 ? (
            applications.map((app) => <AppHistory key={app.id} app={app} />)
          ) : (
            <Card>
              <CardContent className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <Computer className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {applicationsLoading
                      ? "Loading applications..."
                      : "No applications found. Create your first application to get started."}
                  </p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <Separator />

      {/* Incidents Section */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-semibold">Recent Incidents</h2>
          <Badge variant="outline">{incidents.length} total</Badge>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Incident Overview</CardTitle>
            <CardDescription>
              Recent incidents and their current status
            </CardDescription>
          </CardHeader>
          <CardContent>
            {incidents.length > 0 ? (
              <div className="space-y-4">
                {incidents.slice(0, 5).map((incident) => (
                  <div
                    key={incident.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div className="space-y-1">
                      <p className="font-medium">{incident.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {incident.description}
                      </p>
                    </div>
                    <Badge
                      variant={
                        incident.status === "Fixed"
                          ? "default"
                          : incident.status === "Investigating"
                          ? "secondary"
                          : "destructive"
                      }
                    >
                      {incident.status}
                    </Badge>
                  </div>
                ))}
                {incidents.length > 5 && (
                  <p className="text-sm text-muted-foreground text-center">
                    and {incidents.length - 5} more incidents...
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-32">
                <div className="text-center space-y-2">
                  <AlertTriangle className="h-8 w-8 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    {incidentsLoading
                      ? "Loading incidents..."
                      : "No incidents reported. Your systems are running smoothly!"}
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
