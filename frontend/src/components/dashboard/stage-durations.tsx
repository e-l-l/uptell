"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Timer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip } from "../ui/chart";
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
  // Debug logging
  console.log("StageDurations - incidents:", incidents);

  // Fetch logs for all incidents (we'll filter based on actual log data)
  const incidentsWithLogs = incidents;

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
    console.log("StageDurations - logsQueries.data:", logsQueries.data);
    console.log(
      "StageDurations - incidentsWithLogs.length:",
      incidentsWithLogs.length
    );

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
      console.log(
        `Processing incident ${incident.id} with ${logs.length} logs:`,
        logs
      );
      if (logs.length === 0) return;

      // Sort logs by creation time
      const sortedLogs = logs.sort(
        (a, b) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );
      console.log(`Sorted logs for incident ${incident.id}:`, sortedLogs);

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
    const stageData = [
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
    ];

    const result = stageData.filter((stage) => stage.duration > 0);
    return result;
  }, [logsQueries.data, incidentsWithLogs]);

  const chartConfig = {
    duration: {
      label: "Duration (hours)",
      color: "hsl(var(--chart-1))",
    },
    Reported: {
      label: "Reported",
      color: "#f87171",
    },
    Investigating: {
      label: "Investigating",
      color: "#fbbf24",
    },
    Identified: {
      label: "Identified",
      color: "#60a5fa",
    },
    Fixed: {
      label: "Fixed",
      color: "#34d399",
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
          <div className="text-center py-8 space-y-2">
            <p className="text-sm text-muted-foreground">
              No stage duration data available
            </p>
            <p className="text-xs text-muted-foreground">
              {incidents.length === 0
                ? "No incidents found"
                : `${incidents.length} incidents found, but no stage transitions detected`}
            </p>
            <p className="text-xs text-muted-foreground">
              Check console for debugging info
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

            <ChartContainer config={chartConfig} className="h-[150px] w-full">
              <BarChart data={stageDurationData} layout="vertical">
                <CartesianGrid horizontal={false} />
                <XAxis type="number" />
                <YAxis dataKey="stage" type="category" width={80} />
                <ChartTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-background border border-border rounded-lg shadow-lg p-3 space-y-1">
                          <div className="font-medium text-sm">
                            {data.stage} Stage
                          </div>
                          <div className="text-sm">
                            {data.duration} hours average
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Based on {data.count} incident
                            {data.count !== 1 ? "s" : ""}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="duration" />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
