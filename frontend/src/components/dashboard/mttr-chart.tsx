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
import { Incident } from "@/app/(protected)/incidents/types";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface MttrChartProps {
  incidents: Incident[];
  isLoading: boolean;
}

interface IncidentWithResolutionTime extends Incident {
  resolutionTimeHours?: number;
}

export function MttrChart({ incidents, isLoading }: MttrChartProps) {
  // Fetch logs for all fixed incidents
  const fixedIncidents = incidents.filter(
    (incident) => incident.status === "Fixed"
  );

  const logsQueries = useQuery({
    queryKey: ["mttr-logs", fixedIncidents.map((i) => i.id)],
    queryFn: async () => {
      if (fixedIncidents.length === 0) return [];

      // Fetch logs for all fixed incidents
      const logsPromises = fixedIncidents.map(async (incident) => {
        try {
          const logs = await apiClient.get<any[]>(
            `/incidents/${incident.id}/logs`
          );
          return { incident, logs };
        } catch (error) {
          console.error(
            `Failed to fetch logs for incident ${incident.id}:`,
            error
          );
          return { incident, logs: [] };
        }
      });

      return Promise.all(logsPromises);
    },
    enabled: fixedIncidents.length > 0,
  });

  // Calculate MTTR data with real resolution times
  const mttrData = React.useMemo(() => {
    if (!logsQueries.data || fixedIncidents.length === 0) return [];

    const incidentsWithResolutionTimes: IncidentWithResolutionTime[] = [];

    logsQueries.data.forEach(({ incident, logs }) => {
      if (logs.length === 0) return;

      // Sort logs by creation time
      const sortedLogs = logs.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Find the first log (incident creation) and the first "Fixed" log
      const firstLog = sortedLogs[0];
      const fixedLog = sortedLogs.find((log) => log.status === "Fixed");

      if (firstLog && fixedLog) {
        const creationTime = new Date(firstLog.created_at);
        const resolutionTime = new Date(fixedLog.created_at);
        const resolutionTimeHours =
          (resolutionTime.getTime() - creationTime.getTime()) /
          (1000 * 60 * 60);

        incidentsWithResolutionTimes.push({
          ...incident,
          resolutionTimeHours: Math.max(resolutionTimeHours, 0.1), // Minimum 0.1 hours (6 minutes)
        });
      }
    });

    if (incidentsWithResolutionTimes.length === 0) return [];

    // Sort by incident time
    const sortedIncidents = incidentsWithResolutionTimes.sort(
      (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
    );

    // Group incidents by week for MTTR calculation
    const weeklyData: Record<
      string,
      {
        incidents: IncidentWithResolutionTime[];
        totalTime: number;
        count: number;
      }
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
  }, [logsQueries.data, fixedIncidents]);

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

  const isDataLoading = isLoading || logsQueries.isLoading;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Mean Time To Resolve
        </CardTitle>
        <Clock className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isDataLoading ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold">...</div>
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : mttrData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No resolved incidents found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{averageMttr}h</div>
              <div
                className={`flex items-center gap-1 text-xs ${
                  mttrTrend < 0
                    ? "text-green-600"
                    : mttrTrend > 0
                    ? "text-red-600"
                    : "text-gray-600"
                }`}
              >
                <TrendingUp
                  className={`h-3 w-3 ${mttrTrend < 0 ? "rotate-180" : ""}`}
                />
                {Math.abs(mttrTrend).toFixed(1)}h
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Average over last {mttrData.length} weeks
            </p>

            <ChartContainer config={chartConfig} className="h-[200px]">
              <AreaChart
                accessibilityLayer
                data={mttrData}
                margin={{
                  left: 12,
                  right: 12,
                  top: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid vertical={false} />
                <XAxis
                  dataKey="date"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  label={{ value: "Hours", angle: -90, position: "insideLeft" }}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                  labelFormatter={(label) => `Week of ${label}`}
                  formatter={(value, name) => [`${value} hours`, "MTTR"]}
                />
                <Area
                  dataKey="mttr"
                  type="natural"
                  fill="var(--color-mttr)"
                  fillOpacity={0.4}
                  stroke="var(--color-mttr)"
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
