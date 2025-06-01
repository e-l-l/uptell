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
import { Button } from "@/components/ui/button";
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
    <div className="px-12 py-6">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight mb-1">
          System Status
        </h1>
        <p className="text-sm text-muted-foreground">
          Real-time system status and incident updates
        </p>
      </div>

      {/* Organization Selector */}
      <div className="mb-8">
        <Card className="p-4">
          <div className="flex items-center gap-4">
            <label
              htmlFor="org-select"
              className="text-sm font-medium min-w-fit"
            >
              Organization:
            </label>
            <Select
              value={selectedOrgId}
              onValueChange={setSelectedOrgId}
              disabled={isLoadingOrgs}
            >
              <SelectTrigger className="w-full max-w-sm" id="org-select">
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
        </Card>
      </div>

      {selectedOrg && (
        <div className="space-y-8">
          {/* Organization Header */}
          <div className="space-y-2">
            <h2 className="text-2xl font-semibold">{selectedOrg.name}</h2>
            <p className="text-muted-foreground">
              Current system status and recent incidents
            </p>
          </div>

          {/* Overview Cards */}
          {statsOverview && (
            <section className="space-y-6">
              <div>
                <h3 className="text-xl font-semibold mb-1">Overview</h3>
                <p className="text-sm text-muted-foreground">
                  System health at a glance
                </p>
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {/* System Status */}
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium">
                      System Status
                    </CardTitle>
                    <div className="h-4 w-4 rounded-full bg-green-500" />
                  </CardHeader>
                  <CardContent className="space-y-1">
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
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium">
                      Active Incidents
                    </CardTitle>
                    <AlertTriangle className="h-4 w-4 text-red-500" />
                  </CardHeader>
                  <CardContent className="space-y-1">
                    <div className="text-2xl font-bold">
                      {statsOverview.incidents_summary.active_incidents_count}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Issues being resolved
                    </p>
                  </CardContent>
                </Card>

                {/* Current Maintenance */}
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium">
                      Current Maintenance
                    </CardTitle>
                    <Clock className="h-4 w-4 text-orange-500" />
                  </CardHeader>
                  <CardContent className="space-y-1">
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
                <Card className="transition-all hover:shadow-md">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
                    <CardTitle className="text-sm font-medium">
                      Next Maintenance
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-blue-500" />
                  </CardHeader>
                  <CardContent className="space-y-1">
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

          <Separator className="my-8" />

          {/* Services Status */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">Services Status</h3>
                <p className="text-sm text-muted-foreground">
                  Status of all monitored services
                </p>
              </div>
              {statsOverview && (
                <Badge variant="secondary" className="text-xs">
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

          <Separator className="my-8" />

          {/* Recent Incidents Timeline */}
          <section className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold mb-1">Recent Activity</h3>
                <p className="text-sm text-muted-foreground">
                  Timeline of recent incidents and updates
                </p>
              </div>
              {statsOverview && (
                <Badge variant="outline" className="text-xs">
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
        </div>
      )}

      {!selectedOrgId && !isLoadingOrgs && organizations.length === 0 && (
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
              <Building2 className="h-12 w-12 text-muted-foreground" />
              <div className="space-y-2">
                <h3 className="text-lg font-medium">
                  No Organizations Available
                </h3>
                <p className="text-sm text-muted-foreground">
                  There are currently no organizations available for public
                  viewing.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
