"use client";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Application, ApplicationStatus } from "./types";
import React from "react";

const formSchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum([
    "Operational",
    "Degraded Performance",
    "Partial Outage",
    "Major Outage",
    "Unknown",
  ] as const),
});

interface ApplicationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  application?: Application;
  onSubmit: (data: { name: string; status: ApplicationStatus }) => void;
}

export function ApplicationModal({
  open,
  onOpenChange,
  application,
  onSubmit,
}: ApplicationModalProps) {
  console.log("application", application);
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: application?.name || "",
      status: application?.status || "Operational",
    },
  });

  // Add effect to update form values when application changes
  React.useEffect(() => {
    if (application) {
      form.reset({
        name: application.name,
        status: application.status,
      });
    } else {
      form.reset({
        name: "",
        status: "Operational",
      });
    }
  }, [application, form]);

  const handleSubmit = (values: z.infer<typeof formSchema>) => {
    onSubmit(values);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            {application ? "Edit Application" : "Add Application"}
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter application name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Operational">Operational</SelectItem>
                      <SelectItem value="Degraded Performance">
                        Degraded Performance
                      </SelectItem>
                      <SelectItem value="Partial Outage">
                        Partial Outage
                      </SelectItem>
                      <SelectItem value="Major Outage">Major Outage</SelectItem>
                      <SelectItem value="Unknown">Unknown</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button type="submit">{application ? "Update" : "Create"}</Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
