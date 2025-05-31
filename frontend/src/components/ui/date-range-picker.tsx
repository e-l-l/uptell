"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";

interface DateRangePickerProps {
  startDate?: Date;
  endDate?: Date;
  onStartDateChange: (date: Date | undefined) => void;
  onEndDateChange: (date: Date | undefined) => void;
  placeholder?: string;
  className?: string;
}

export function DateRangePicker({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  placeholder = "Pick a date range",
  className,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);

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
              {format(startDate, "MMM dd")} - {format(endDate, "MMM dd")}
            </>
          ) : (
            <span>{placeholder}</span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 border-border" align="start">
        <div className="flex">
          <div className="p-3 bg-background">
            <div className="text-sm font-medium mb-2">Start Date</div>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={onStartDateChange}
              initialFocus
            />
          </div>
          <div className="p-3 bg-background border-l border-border">
            <div className="text-sm font-medium mb-2">End Date</div>
            <Calendar
              mode="single"
              selected={endDate}
              onSelect={onEndDateChange}
              disabled={(date) => (startDate ? date < startDate : false)}
            />
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
