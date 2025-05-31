"use client";

import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DateTimeRangePicker } from "@/components/ui/datetime-range-picker";
import { Maintenance } from "./types";
import { useApplications } from "../applications/services";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { useAtomValue } from "jotai";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

const formSchema = z.object({
  title: z.string().min(1, "Title is required"),
  app_id: z.string().min(1, "Application is required"),
});

interface MaintenanceModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  maintenance?: Maintenance;
  onSubmit: (data: {
    title: string;
    app_id: string;
    start_time: string;
    end_time: string;
  }) => void;
  isLoading?: boolean;
}

export function MaintenanceModal({
  open,
  onOpenChange,
  maintenance,
  onSubmit,
  isLoading,
}: MaintenanceModalProps) {
  const currentOrg = useAtomValue(currentOrgAtom);
  const { data: applications = [] } = useApplications(currentOrg?.id);

  const [startDate, setStartDate] = React.useState<Date | undefined>(
    maintenance?.start_time ? new Date(maintenance.start_time) : undefined
  );
  const [endDate, setEndDate] = React.useState<Date | undefined>(
    maintenance?.end_time ? new Date(maintenance.end_time) : undefined
  );

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: maintenance?.title || "",
      app_id: maintenance?.app_id || "",
    },
  });

  // Reset form and dates when maintenance prop changes
  React.useEffect(() => {
    form.reset({
      title: maintenance?.title || "",
      app_id: maintenance?.app_id || "",
    });
    setStartDate(
      maintenance?.start_time ? new Date(maintenance.start_time) : undefined
    );
    setEndDate(
      maintenance?.end_time ? new Date(maintenance.end_time) : undefined
    );
  }, [maintenance, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    if (!startDate || !endDate) {
      return; // Form validation will handle this
    }

    onSubmit({
      title: values.title,
      app_id: values.app_id,
      start_time: startDate.toISOString(),
      end_time: endDate.toISOString(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {maintenance ? "Edit Maintenance" : "Schedule Maintenance"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter maintenance title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="app_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Application</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select application" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {applications.map((app) => (
                        <SelectItem key={app.id} value={app.id}>
                          {app.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="space-y-2">
              <Label>Maintenance Period</Label>
              <DateTimeRangePicker
                startDate={startDate}
                endDate={endDate}
                onStartDateChange={setStartDate}
                onEndDateChange={setEndDate}
                placeholder="Select maintenance start and end date/time"
              />
              {(!startDate || !endDate) && (
                <p className="text-sm text-destructive">
                  Both start and end dates are required
                </p>
              )}
              {startDate && endDate && endDate <= startDate && (
                <p className="text-sm text-destructive">
                  End time must be after start time
                </p>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {maintenance ? "Update" : "Schedule"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
