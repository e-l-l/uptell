"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { TrendingUp, Clock } from "lucide-react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { Incident, IncidentLog } from "@/app/(protected)/incidents/types";
import { useBulkIncidentLogs } from "@/app/(protected)/incidents/services";

interface MttrChartProps {
  incidents: Incident[];
  isLoading: boolean;
}

export function MttrChart({ incidents, isLoading }: MttrChartProps) {
  // Filter to only "Fixed" incidents for MTTR calculation
  const fixedIncidents = React.useMemo(
    () => incidents.filter((incident) => incident.status === "Fixed"),
    [incidents]
  );

  // Get incident IDs for bulk log fetching
  const incidentIds = React.useMemo(
    () => fixedIncidents.map((incident) => incident.id),
    [fixedIncidents]
  );

  // Use bulk logs service for better performance
  const { data: bulkLogsData = {}, isLoading: logsLoading } =
    useBulkIncidentLogs(incidentIds);

  const mttrData = React.useMemo(() => {
    if (fixedIncidents.length === 0) return [];

    // Calculate resolution time for each incident
    const incidentsWithResolutionTime = [];

    for (const incident of fixedIncidents) {
      const logs = bulkLogsData[incident.id] || [];

      if (logs.length === 0) continue;

      // Sort logs by created_at time
      const sortedLogs = logs.sort(
        (a: IncidentLog, b: IncidentLog) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      const firstLog = sortedLogs[0];
      const fixedLog = sortedLogs.find(
        (log: IncidentLog) => log.status === "Fixed"
      );

      if (firstLog && fixedLog) {
        const startTime = new Date(firstLog.created_at);
        const endTime = new Date(fixedLog.created_at);
        const resolutionTimeMs = endTime.getTime() - startTime.getTime();
        const resolutionTimeHours = resolutionTimeMs / (1000 * 60 * 60);

        incidentsWithResolutionTime.push({
          ...incident,
          resolutionTimeHours,
        });
      }
    }

    if (incidentsWithResolutionTime.length === 0) return [];

    // Sort incidents by date
    const sortedIncidents = incidentsWithResolutionTime.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Group by week and calculate weekly MTTR
    const weeklyData: Record<
      string,
      { incidents: any[]; totalTime: number; count: number }
    > = {};

    sortedIncidents.forEach((incident) => {
      if (!incident.resolutionTimeHours) return;

      const incidentDate = new Date(incident.time);
      // Get the Monday of the week
      const mondayOfWeek = new Date(incidentDate);
      mondayOfWeek.setDate(incidentDate.getDate() - incidentDate.getDay() + 1);
      const weekKey = mondayOfWeek.toISOString().split("T")[0];

      if (!weeklyData[weekKey]) {
        weeklyData[weekKey] = { incidents: [], totalTime: 0, count: 0 };
      }

      weeklyData[weekKey].totalTime += incident.resolutionTimeHours;
      weeklyData[weekKey].count += 1;
      weeklyData[weekKey].incidents.push(incident);
    });

    // Convert to chart data format
    return Object.entries(weeklyData)
      .map(([week, data]) => ({
        week,
        mttr: Math.round((data.totalTime / data.count) * 100) / 100, // Round to 2 decimal places
        incidents: data.count,
        date: new Date(week).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
      }))
      .slice(-8); // Last 8 weeks
  }, [fixedIncidents, bulkLogsData]);

  const chartConfig = {
    mttr: {
      label: "MTTR (hours)",
      color: "#ffffff",
    },
  } satisfies ChartConfig;

  const averageMttr = React.useMemo(() => {
    if (mttrData.length === 0) return 0;
    const total = mttrData.reduce((sum, data) => sum + data.mttr, 0);
    return Math.round((total / mttrData.length) * 100) / 100;
  }, [mttrData]);

  const mttrTrend = React.useMemo(() => {
    if (mttrData.length < 2) return 0;
    const recent = mttrData[mttrData.length - 1].mttr;
    const previous = mttrData[mttrData.length - 2].mttr;
    return recent - previous;
  }, [mttrData]);

  const isDataLoading = isLoading || logsLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">MTTR Trend</CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isDataLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : mttrData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Clock className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No resolution data available</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{averageMttr}h</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <TrendingUp
                  className={`h-3 w-3 ${
                    mttrTrend > 0 ? "text-red-500" : "text-green-500"
                  }`}
                />
                <span>
                  {mttrTrend > 0 ? "+" : ""}
                  {mttrTrend.toFixed(1)}h from last week
                </span>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to resolution: {mttrData.length} weeks of data
            </p>

            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <AreaChart data={mttrData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 10 }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <ChartTooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3 space-y-1">
                          <div className="font-medium text-xs">{label}</div>
                          <div className="text-xs">MTTR: {data.mttr} hours</div>
                          <div className="text-xs text-muted-foreground">
                            {data.incidents} incident
                            {data.incidents !== 1 ? "s" : ""} resolved
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="mttr"
                  stroke="var(--color-mttr)"
                  fill="var(--color-mttr)"
                  fillOpacity={0.6}
                  strokeWidth={2}
                />
              </AreaChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
