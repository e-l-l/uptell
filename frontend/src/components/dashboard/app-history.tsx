"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, TrendingUp, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { AppHistoryData, AppHistoryProps } from "./types";
import { apiClient } from "@/lib/api-client";
import { getAppChartColors } from "@/app/(protected)/applications/utils";
import { ApplicationStatus } from "@/app/(protected)/applications/types";

// Status to numerical value mapping for charting
const statusValues = {
  Operational: 4,
  "Degraded Performance": 3,
  "Partial Outage": 2,
  "Major Outage": 1,
  Unknown: 0,
};

export function AppHistory({ app }: AppHistoryProps) {
  const [timeRange, setTimeRange] = useState("7d");
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [historyData, setHistoryData] = useState<AppHistoryData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Calculate date range based on selection
  const getApplicationHistory = async (
    appId: string,
    startTime?: Date,
    endTime?: Date
  ): Promise<AppHistoryData[] | undefined> => {
    setIsLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (startTime) params.append("start_time", startTime.toISOString());
    if (endTime) params.append("end_time", endTime.toISOString());

    try {
      const response = await apiClient.get<AppHistoryData[]>(
        `/applications/${appId}/history?${params}`
      );
      return response;
    } catch (err) {
      setError(err as Error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const fetchHistory = async () => {
      const history = await getApplicationHistory(app.id, startDate, endDate);
      if (history) {
        setHistoryData(history);
      }
    };
    fetchHistory();
  }, [app.id, startDate, endDate]);
  const getDateRange = () => {
    const now = new Date();

    if (timeRange === "custom" && startDate && endDate) {
      return { start: startDate, end: endDate };
    }

    const ranges = {
      "1d": 1,
      "7d": 7,
      "30d": 30,
      "90d": 90,
    };

    const days = ranges[timeRange as keyof typeof ranges] || 7;
    const start = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    return { start, end: now };
  };

  const { start, end } = getDateRange();

  // Transform data for the segmented bar chart
  const createSegments = () => {
    if (historyData.length === 0) return [];

    const sortedData = [...historyData].sort(
      (a, b) =>
        new Date(a.recorded_at).getTime() - new Date(b.recorded_at).getTime()
    );

    const segments = [];
    const { start: rangeStart, end: rangeEnd } = getDateRange();

    for (let i = 0; i < sortedData.length; i++) {
      const current = sortedData[i];
      const currentTime = new Date(current.recorded_at).getTime();
      const next = sortedData[i + 1];

      const segmentStart = i === 0 ? rangeStart.getTime() : currentTime;
      const segmentEnd = next
        ? new Date(next.recorded_at).getTime()
        : rangeEnd.getTime();

      segments.push({
        status: current.status,
        start: segmentStart,
        end: segmentEnd,
        duration: segmentEnd - segmentStart,
      });
    }

    // If no data, show unknown status for entire range
    if (segments.length === 0) {
      segments.push({
        status: "Unknown",
        start: rangeStart.getTime(),
        end: rangeEnd.getTime(),
        duration: rangeEnd.getTime() - rangeStart.getTime(),
      });
    }

    return segments;
  };

  const segments = createSegments();
  const totalDuration = segments.reduce((acc, seg) => acc + seg.duration, 0);

  // Calculate uptime percentage
  const uptimePercentage =
    totalDuration > 0
      ? Math.round(
          (segments
            .filter(
              (seg) =>
                seg.status === "Operational" ||
                seg.status === "Degraded Performance" ||
                seg.status === "Partial Outage"
            )
            .reduce((acc, seg) => acc + seg.duration, 0) /
            totalDuration) *
            100
        )
      : 100;

  // Get current status
  const currentStatus =
    segments.length > 0 ? segments[segments.length - 1].status : app.status;

  const handleTimeRangeChange = (value: string) => {
    setTimeRange(value);
    if (value !== "custom") {
      setShowDatePicker(false);
      setStartDate(undefined);
      setEndDate(undefined);
    } else {
      setShowDatePicker(true);
    }
  };

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            {app.name} Status History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-[300px] text-muted-foreground">
            <p>Failed to load status history</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            <CardTitle>{app.name} Status History</CardTitle>
          </div>

          {!isLoading && segments.length > 0 && (
            <>
              <div className="flex items-center gap-2">
                <div
                  className={cn(
                    "w-3 h-3 rounded-full",
                    getAppChartColors(currentStatus as ApplicationStatus)
                  )}
                />
                <span className="text-sm font-medium">
                  Current: {currentStatus}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-green-500" />
                <span className="text-sm text-muted-foreground">
                  {uptimePercentage}% uptime
                </span>
              </div>

              <span className="text-sm text-muted-foreground">
                {segments.length} status periods
              </span>
            </>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Select value={timeRange} onValueChange={handleTimeRangeChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1d">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="custom">Custom</SelectItem>
            </SelectContent>
          </Select>

          {showDatePicker && (
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-[240px] justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate && endDate ? (
                    <>
                      {format(startDate, "MMM dd")} -{" "}
                      {format(endDate, "MMM dd")}
                    </>
                  ) : (
                    <span>Pick a date range</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 border-border" align="end">
                <div className="flex">
                  <div className="p-3 bg-background">
                    <div className="text-sm font-medium mb-2">Start Date</div>
                    <Calendar
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                    />
                  </div>
                  <div className="p-3 bg-background border-l border-border">
                    <div className="text-sm font-medium mb-2">End Date</div>
                    <Calendar
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      disabled={(date) =>
                        startDate ? date < startDate : false
                      }
                    />
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          )}
        </div>
      </CardHeader>

      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-[300px]">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : segments.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
            <Activity className="h-12 w-12 mb-4 opacity-50" />
            <p className="text-lg font-medium">No status history available</p>
            <p className="text-sm">
              Status changes will appear here once recorded
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex w-full h-8 rounded-lg overflow-hidden">
                {segments.map((segment, i) => {
                  const widthPercent = (segment.duration / totalDuration) * 100;
                  const statusColorClass = getAppChartColors(
                    segment.status as ApplicationStatus
                  );

                  return (
                    <div
                      key={i}
                      className={`${statusColorClass} h-full hover:opacity-80 transition-opacity cursor-pointer`}
                      style={{ width: `${widthPercent}%` }}
                      title={`${segment.status} - ${new Date(
                        segment.start
                      ).toLocaleString()} → ${new Date(
                        segment.end
                      ).toLocaleString()}`}
                    />
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>{format(start, "MMM dd, yyyy HH:mm")}</span>
              <div className="flex items-center gap-4">
                {Object.entries(statusValues).map(([status, _]) => {
                  const statusSegments = segments.filter(
                    (seg) => seg.status === status
                  );
                  const statusDuration = statusSegments.reduce(
                    (acc, seg) => acc + seg.duration,
                    0
                  );
                  const statusPercentage =
                    totalDuration > 0
                      ? Math.round((statusDuration / totalDuration) * 100)
                      : 0;

                  if (statusSegments.length === 0) return null;

                  return (
                    <div key={status} className="flex items-center gap-2">
                      <div
                        className={`w-3 h-3 rounded-sm ${getAppChartColors(
                          status as ApplicationStatus
                        )}`}
                      />
                      <div className="flex flex-col">
                        <span className="font-medium">{status}</span>
                        <span className="text-muted-foreground text-xs">
                          {statusPercentage}%
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
              <span>{format(end, "MMM dd, yyyy HH:mm")}</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
