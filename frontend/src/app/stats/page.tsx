"use client";

import React, { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PublicServicesList } from "@/components/public/services-list";
import { PublicIncidentTimeline } from "@/components/public/incident-timeline";
import { usePublicStats } from "@/hooks/usePublicStats";
import { AlertTriangle, Building2, Calendar, Clock } from "lucide-react";

export default function PublicStatsPage() {
  const [selectedOrgId, setSelectedOrgId] = useState<string>("");

  const {
    organizations,
    statsOverview,
    isLoadingOrgs,
    isLoadingStats,
    fetchStatsOverview,
  } = usePublicStats();

  // Load the first organization by default
  useEffect(() => {
    if (organizations.length > 0 && !selectedOrgId) {
      setSelectedOrgId(organizations[0].id);
    }
  }, [organizations, selectedOrgId]);

  // Fetch stats when organization changes
  useEffect(() => {
    if (selectedOrgId) {
      fetchStatsOverview(selectedOrgId);
    }
  }, [selectedOrgId, fetchStatsOverview]);

  const selectedOrg = organizations.find(
    (org: any) => org.id === selectedOrgId
  );

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-2">
            <Building2 className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">System Status</h1>
          </div>
          <p className="text-muted-foreground">
            Real-time system status and incident updates.
          </p>

          {/* Organization Selector */}
          <div className="flex items-center gap-4">
            <label htmlFor="org-select" className="text-sm font-medium">
              Organization:
            </label>
            <Select
              value={selectedOrgId}
              onValueChange={setSelectedOrgId}
              disabled={isLoadingOrgs}
            >
              <SelectTrigger className="w-[300px]" id="org-select">
                <SelectValue placeholder="Select an organization" />
              </SelectTrigger>
              <SelectContent>
                {organizations.map((org: any) => (
                  <SelectItem key={org.id} value={org.id}>
                    {org.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedOrg && (
          <>
            {/* Organization Header */}
            <div className="mb-6">
              <h2 className="text-2xl font-semibold">{selectedOrg.name}</h2>
              <p className="text-muted-foreground">
                Current system status and recent incidents
              </p>
            </div>

            {/* Overview Cards */}
            {statsOverview && (
              <section className="space-y-4 mb-8">
                <h3 className="text-xl font-semibold">Overview</h3>
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {/* System Status */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        System Status
                      </CardTitle>
                      <div className="h-4 w-4 rounded-full bg-green-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsOverview.incidents_summary
                          .active_incidents_count === 0
                          ? "All Systems Operational"
                          : "Issues Detected"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {statsOverview.services.length} services monitored
                      </p>
                    </CardContent>
                  </Card>

                  {/* Active Incidents */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Active Incidents
                      </CardTitle>
                      <AlertTriangle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsOverview.incidents_summary.active_incidents_count}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Issues being resolved
                      </p>
                    </CardContent>
                  </Card>

                  {/* Current Maintenance */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Current Maintenance
                      </CardTitle>
                      <Clock className="h-4 w-4 text-orange-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {
                          statsOverview.incidents_summary
                            .current_maintenance_count
                        }
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Ongoing maintenance windows
                      </p>
                    </CardContent>
                  </Card>

                  {/* Next Maintenance */}
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">
                        Next Maintenance
                      </CardTitle>
                      <Calendar className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">
                        {statsOverview.incidents_summary.next_maintenance
                          ? new Date(
                              statsOverview.incidents_summary.next_maintenance.start_time
                            ).toLocaleDateString()
                          : "None Scheduled"}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {statsOverview.incidents_summary.next_maintenance
                          ? new Date(
                              statsOverview.incidents_summary.next_maintenance.start_time
                            ).toLocaleTimeString()
                          : "No upcoming maintenance"}
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </section>
            )}

            <Separator />

            {/* Services Status */}
            <section className="space-y-4 mb-8">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">Services Status</h3>
                {statsOverview && (
                  <Badge variant="secondary">
                    {statsOverview.services.length} services
                  </Badge>
                )}
              </div>
              <PublicServicesList
                orgId={selectedOrgId}
                services={statsOverview?.services || []}
                isLoading={isLoadingStats}
              />
            </section>

            <Separator />

            {/* Recent Incidents Timeline */}
            <section className="space-y-4">
              <div className="flex items-center gap-2">
                <h3 className="text-xl font-semibold">Recent Activity</h3>
                {statsOverview && (
                  <Badge variant="outline">
                    {statsOverview.recent_timeline.length} recent events
                  </Badge>
                )}
              </div>
              <PublicIncidentTimeline
                orgId={selectedOrgId}
                timeline={statsOverview?.recent_timeline || []}
                isLoading={isLoadingStats}
              />
            </section>
          </>
        )}

        {!selectedOrgId && !isLoadingOrgs && organizations.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center h-32">
              <div className="text-center space-y-2">
                <Building2 className="h-8 w-8 mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No organizations available for public viewing.
                </p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
