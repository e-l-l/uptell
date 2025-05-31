"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { BarChart3, Timer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "../ui/chart";
import { Incident } from "@/app/(protected)/incidents/types";
import { useQuery } from "@tanstack/react-query";
import { apiClient } from "@/lib/api-client";

interface StageDurationsProps {
  incidents: Incident[];
  isLoading: boolean;
}

interface IncidentLog {
  id: string;
  incident_id: string;
  status: string;
  message: string;
  created_at: string;
}

export function StageDurations({ incidents, isLoading }: StageDurationsProps) {
  // Fetch logs for all incidents that have progressed through stages
  const incidentsWithLogs = incidents.filter(
    (incident) => incident.status !== "Reported" || incidents.length > 0
  );

  const logsQueries = useQuery({
    queryKey: ["stage-durations-logs", incidentsWithLogs.map((i) => i.id)],
    queryFn: async () => {
      if (incidentsWithLogs.length === 0) return [];

      // Fetch logs for all incidents
      const logsPromises = incidentsWithLogs.map(async (incident) => {
        try {
          const logs = await apiClient.get<IncidentLog[]>(
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
    enabled: incidentsWithLogs.length > 0,
  });

  // Calculate average stage durations from real logs
  const stageDurationData = React.useMemo(() => {
    if (!logsQueries.data || incidentsWithLogs.length === 0) return [];

    const stageCounts = {
      Reported: 0,
      Investigating: 0,
      Identified: 0,
      Fixed: 0,
    };

    const stageDurations = {
      Reported: 0,
      Investigating: 0,
      Identified: 0,
      Fixed: 0,
    };

    logsQueries.data.forEach(({ incident, logs }) => {
      if (logs.length === 0) return;

      // Sort logs by creation time
      const sortedLogs = logs.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Calculate durations between stages
      for (let i = 0; i < sortedLogs.length; i++) {
        const currentLog = sortedLogs[i];
        const nextLog = sortedLogs[i + 1];

        if (nextLog) {
          const duration =
            (new Date(nextLog.created_at).getTime() -
              new Date(currentLog.created_at).getTime()) /
            (1000 * 60 * 60); // hours

          // Add duration to the current stage
          if (currentLog.status in stageDurations) {
            stageDurations[currentLog.status as keyof typeof stageDurations] +=
              Math.max(duration, 0.1);
            stageCounts[currentLog.status as keyof typeof stageCounts]++;
          }
        } else {
          // For the last stage (if it's not Fixed), calculate duration until now
          if (currentLog.status !== "Fixed") {
            const duration =
              (Date.now() - new Date(currentLog.created_at).getTime()) /
              (1000 * 60 * 60); // hours
            if (currentLog.status in stageDurations) {
              stageDurations[
                currentLog.status as keyof typeof stageDurations
              ] += Math.max(duration, 0.1);
              stageCounts[currentLog.status as keyof typeof stageCounts]++;
            }
          }
        }
      }
    });

    // Calculate averages and format for chart
    return [
      {
        stage: "Reported",
        duration:
          stageCounts.Reported > 0
            ? Math.round(
                (stageDurations.Reported / stageCounts.Reported) * 100
              ) / 100
            : 0,
        count: stageCounts.Reported,
        fill: "#f87171", // Light red
      },
      {
        stage: "Investigating",
        duration:
          stageCounts.Investigating > 0
            ? Math.round(
                (stageDurations.Investigating / stageCounts.Investigating) * 100
              ) / 100
            : 0,
        count: stageCounts.Investigating,
        fill: "#fbbf24", // Light amber
      },
      {
        stage: "Identified",
        duration:
          stageCounts.Identified > 0
            ? Math.round(
                (stageDurations.Identified / stageCounts.Identified) * 100
              ) / 100
            : 0,
        count: stageCounts.Identified,
        fill: "#60a5fa", // Light blue
      },
      {
        stage: "Fixed",
        duration:
          stageCounts.Fixed > 0
            ? Math.round((stageDurations.Fixed / stageCounts.Fixed) * 100) / 100
            : 0,
        count: stageCounts.Fixed,
        fill: "#34d399", // Light green
      },
    ].filter((stage) => stage.duration > 0);
  }, [logsQueries.data, incidentsWithLogs]);

  const chartConfig = {
    duration: {
      label: "Duration (hours)",
    },
    Reported: {
      label: "Reported",
      color: "hsl(var(--chart-1))",
    },
    Investigating: {
      label: "Investigating",
      color: "hsl(var(--chart-2))",
    },
    Identified: {
      label: "Identified",
      color: "hsl(var(--chart-3))",
    },
    Fixed: {
      label: "Fixed",
      color: "hsl(var(--chart-4))",
    },
  } satisfies ChartConfig;

  const longestStage = React.useMemo(() => {
    if (stageDurationData.length === 0) return { stage: "N/A", duration: 0 };
    return stageDurationData.reduce((max, stage) =>
      stage.duration > max.duration ? stage : max
    );
  }, [stageDurationData]);

  const totalDuration = React.useMemo(() => {
    return (
      Math.round(
        stageDurationData.reduce((sum, stage) => sum + stage.duration, 0) * 100
      ) / 100
    );
  }, [stageDurationData]);

  const isDataLoading = isLoading || logsQueries.isLoading;

  return (
    <Card className="flex flex-col justify-between">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Stage Durations</CardTitle>
        <Timer className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isDataLoading ? (
          <div className="space-y-2">
            <div className="text-2xl font-bold">...</div>
            <p className="text-xs text-muted-foreground">Loading...</p>
          </div>
        ) : stageDurationData.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-sm text-muted-foreground">
              No incident data found
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold">{longestStage.duration}h</div>
              <div className="text-xs text-muted-foreground">
                Longest: {longestStage.stage}
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Total avg cycle time: {totalDuration}h
            </p>

            <ChartContainer config={chartConfig} className="h-[200px]">
              <BarChart
                accessibilityLayer
                data={stageDurationData}
                layout="horizontal"
                margin={{
                  left: 80,
                  right: 12,
                  top: 12,
                  bottom: 12,
                }}
              >
                <CartesianGrid horizontal={false} />
                <XAxis
                  type="number"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  label={{
                    value: "Hours",
                    position: "insideBottom",
                    offset: -10,
                  }}
                />
                <YAxis
                  dataKey="stage"
                  type="category"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  fontSize={12}
                  width={70}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="line" />}
                  formatter={(value, name, props) => [
                    `${value} hours`,
                    `Avg ${props.payload.stage} time`,
                  ]}
                  labelFormatter={(label) => `${label} Stage`}
                />
                <Bar
                  dataKey="duration"
                  layout="horizontal"
                  radius={[0, 4, 4, 0]}
                />
              </BarChart>
            </ChartContainer>

            {/* Stage breakdown */}
            <div className="space-y-2">
              {stageDurationData.map((stage) => (
                <div
                  key={stage.stage}
                  className="flex items-center justify-between text-sm"
                >
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-sm"
                      style={{ backgroundColor: stage.fill }}
                    />
                    <span>{stage.stage}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>{stage.duration}h avg</span>
                    <span>({stage.count} incidents)</span>
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
