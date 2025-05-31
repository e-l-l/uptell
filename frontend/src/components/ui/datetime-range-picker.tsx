"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface DateTimeRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateTimeRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = "Pick start and end date/time",
  className,
}: DateTimeRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [startTime, setStartTime] = useState(
    startDate ? format(startDate, "HH:mm") : "09:00"
  );
  const [endTime, setEndTime] = useState(
    endDate ? format(endDate, "HH:mm") : "17:00"
  );

  const handleStartDateChange = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = startTime.split(":").map(Number);
      date.setHours(hours, minutes, 0, 0);
    }
    onStartDateChange(date);
  };

  const handleEndDateChange = (date: Date | undefined) => {
    if (date) {
      const [hours, minutes] = endTime.split(":").map(Number);
      date.setHours(hours, minutes, 0, 0);

      // If start and end dates are the same, ensure end time is after start time
      if (
        startDate &&
        startDate.toDateString() === date.toDateString() &&
        date <= startDate
      ) {
        // Set end time to be 1 hour after start time if invalid
        const validEndTime = new Date(startDate.getTime() + 60 * 60 * 1000);
        setEndTime(format(validEndTime, "HH:mm"));
        date.setHours(validEndTime.getHours(), validEndTime.getMinutes(), 0, 0);
      }
    }
    onEndDateChange(date);
  };

  const handleStartTimeChange = (time: string) => {
    setStartTime(time);
    if (startDate) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(startDate);
      newDate.setHours(hours, minutes, 0, 0);
      onStartDateChange(newDate);
    }
  };

  const handleEndTimeChange = (time: string) => {
    setEndTime(time);
    if (endDate) {
      const [hours, minutes] = time.split(":").map(Number);
      const newDate = new Date(endDate);
      newDate.setHours(hours, minutes, 0, 0);

      // If start and end dates are the same, ensure end time is after start time
      if (
        startDate &&
        startDate.toDateString() === endDate.toDateString() &&
        newDate <= startDate
      ) {
        // Set end time to be 1 hour after start time if invalid
        const validEndTime = new Date(startDate.getTime() + 60 * 60 * 1000);
        setEndTime(format(validEndTime, "HH:mm"));
        onEndDateChange(validEndTime);
        return;
      }

      onEndDateChange(newDate);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal",
            !startDate && !endDate && "text-muted-foreground",
            className
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {startDate && endDate ? (
            <>
              {format(startDate, "MMM dd HH:mm")} -{" "}
              {format(endDate, "MMM dd HH:mm")}
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-border" align="start">
        <div className="flex">
          <div className="p-3 bg-background space-y-3">
            <div className="text-sm font-medium">Start Date & Time</div>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={handleStartDateChange}
              initialFocus
            />
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Start Time
              </Label>
              <Input
                type="time"
                value={startTime}
                onChange={(e) => handleStartTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
          <div className="p-3 bg-background border-l border-border space-y-3">
            <div className="text-sm font-medium">End Date & Time</div>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={handleEndDateChange}
              disabled={(date) =>
                startDate
                  ? date < new Date(startDate.setHours(0, 0, 0, 0))
                  : false
              }
            />
            <div className="space-y-2">
              <Label className="text-sm flex items-center gap-2">
                <Clock className="h-4 w-4" />
                End Time
              </Label>
              <Input
                type="time"
                value={endTime}
                onChange={(e) => handleEndTimeChange(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
