"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Timer } from "lucide-react";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import { ChartConfig, ChartContainer, ChartTooltip } from "../ui/chart";
import { Incident, IncidentLog } from "@/app/(protected)/incidents/types";
import { useBulkIncidentLogs } from "@/app/(protected)/incidents/services";

interface StageDurationsProps {
  incidents: Incident[];
  isLoading: boolean;
}

export function StageDurations({ incidents, isLoading }: StageDurationsProps) {
  // Get incident IDs for bulk log fetching
  const incidentIds = React.useMemo(
    () => incidents.map((incident) => incident.id),
    [incidents]
  );

  // Use bulk logs service for better performance
  const { data: bulkLogsData = {}, isLoading: logsLoading } =
    useBulkIncidentLogs(incidentIds);

  const stageDurationData = React.useMemo(() => {
    if (incidents.length === 0) return [];

    const stageDurations = {
      Reported: 0,
      Investigating: 0,
      Identified: 0,
    };

    const stageCounts = {
      Reported: 0,
      Investigating: 0,
      Identified: 0,
    };

    for (const incident of incidents) {
      const logs = bulkLogsData[incident.id] || [];

      if (logs.length === 0) continue;

      // Sort logs by creation time
      const sortedLogs = logs.sort(
        (a: IncidentLog, b: IncidentLog) =>
          new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
      );

      // Calculate time spent in each stage
      for (let i = 0; i < sortedLogs.length - 1; i++) {
        const currentLog = sortedLogs[i];
        const nextLog = sortedLogs[i + 1];

        const stageStart = new Date(currentLog.created_at);
        const stageEnd = new Date(nextLog.created_at);
        const stageDurationHours =
          (stageEnd.getTime() - stageStart.getTime()) / (1000 * 60 * 60);

        if (currentLog.status === "Reported") {
          stageDurations.Reported += stageDurationHours;
          stageCounts.Reported += 1;
        } else if (currentLog.status === "Investigating") {
          stageDurations.Investigating += stageDurationHours;
          stageCounts.Investigating += 1;
        } else if (currentLog.status === "Identified") {
          stageDurations.Identified += stageDurationHours;
          stageCounts.Identified += 1;
        }
      }
    }

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
        fill: "var(--color-Reported)",
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
        fill: "var(--color-Investigating)",
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
        fill: "var(--color-Identified)",
      },
    ];

    const result = stageData.filter((stage) => stage.duration > 0);
    return result;
  }, [incidents, bulkLogsData]);

  const chartConfig = {
    duration: {
      label: "Duration (hours)",
      color: "#a88fd9",
    },
    Reported: {
      label: "Reported",
      color: "#d98787",
    },
    Investigating: {
      label: "Investigating",
      color: "#d9b587",
    },
    Identified: {
      label: "Identified",
      color: "#d9c88f",
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

  const isDataLoading = isLoading || logsLoading;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-base font-medium">Stage Durations</CardTitle>
        <Timer className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isDataLoading ? (
          <div className="flex items-center justify-center h-[200px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : stageDurationData.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[200px] text-muted-foreground">
            <Timer className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No stage duration data available</p>
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
                          <div className="font-medium text-xs">
                            {data.stage} Stage
                          </div>
                          <div className="text-xs">
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
                <Bar dataKey="duration" radius={4} />
              </BarChart>
            </ChartContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
