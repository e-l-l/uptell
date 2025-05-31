"use client";

import React, { useState } from "react";
import { useParams } from "next/navigation";
import {
  useIncident,
  useIncidentLogs,
  useCreateIncidentLog,
  useUpdateIncident,
} from "../services";
import { useApplications } from "../../applications/services";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  CalendarIcon,
  ClockIcon,
  AlertCircleIcon,
  InfoIcon,
  PlusIcon,
  EditIcon,
  SaveIcon,
  XIcon,
} from "lucide-react";
import { useAtomValue } from "jotai";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { IncidentStatus } from "../types";
import { Input } from "@/components/ui/input";
import { getIncidentStatusColor } from "../utils";

const statusIcons = {
  Reported: AlertCircleIcon,
  Investigating: ClockIcon,
  Identified: InfoIcon,
  Fixed: CheckCircleIcon,
} as const;

function CheckCircleIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22,4 12,14.01 9,11.01" />
    </svg>
  );
}

export default function IncidentDetailsPage() {
  const params = useParams();
  const incidentId = params.id as string;

  const currentOrg = useAtomValue(currentOrgAtom);
  const {
    data: incident,
    isLoading: incidentLoading,
    error: incidentError,
  } = useIncident(incidentId);
  const { data: logs = [], isLoading: logsLoading } =
    useIncidentLogs(incidentId);
  const { data: applications = [] } = useApplications(currentOrg?.id);
  const createLogMutation = useCreateIncidentLog();
  const updateIncidentMutation = useUpdateIncident();

  // Add log form state
  const [isAddLogOpen, setIsAddLogOpen] = useState(false);
  const [logForm, setLogForm] = useState({
    status: "" as IncidentStatus | "",
    message: "",
  });

  // Edit form state
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    app_id: "",
  });

  // Initialize edit form when incident data loads
  React.useEffect(() => {
    if (incident) {
      setEditForm({
        title: incident.title,
        description: incident.description,
        app_id: incident.app_id,
      });
    }
  }, [incident]);

  // Find the application name based on app_id
  const applicationName =
    applications.find(
      (app) => app.id === (isEditing ? editForm.app_id : incident?.app_id)
    )?.name || (isEditing ? editForm.app_id : incident?.app_id);

  // Handle add log form submission
  const handleAddLog = async () => {
    if (!logForm.status || !logForm.message.trim()) {
      return;
    }

    try {
      await createLogMutation.mutateAsync({
        incident_id: incidentId,
        status: logForm.status,
        message: logForm.message.trim(),
      });

      // Update the incident status to match the new log status
      if (incident) {
        await updateIncidentMutation.mutateAsync({
          id: incident.id,
          data: {
            title: incident.title,
            description: incident.description,
            app_id: incident.app_id,
            status: logForm.status,
          },
        });
      }

      // Reset form and close dialog
      setLogForm({ status: "", message: "" });
      setIsAddLogOpen(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
    }
  };

  // Handle edit mode toggle
  const handleEditToggle = () => {
    if (isEditing && incident) {
      // Reset form to original values when canceling
      setEditForm({
        title: incident.title,
        description: incident.description,
        app_id: incident.app_id,
      });
    }
    setIsEditing(!isEditing);
  };

  // Handle save changes
  const handleSaveChanges = () => {
    if (!incident) return;

    try {
      updateIncidentMutation.mutate({
        id: incident.id,
        data: {
          title: editForm.title.trim(),
          description: editForm.description.trim(),
          app_id: editForm.app_id,
        },
      });
      setIsEditing(false);
    } catch (error) {
      // Error is handled by the mutation's onError callback
      // Keep editing mode active on error so user can retry
    }
  };

  if (incidentLoading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-20 w-full" />
              </CardContent>
            </Card>
          </div>
          <div>
            <Card>
              <CardHeader>
                <Skeleton className="h-6 w-1/2" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-32 w-full" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  if (incidentError || !incident) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardContent className="flex items-center justify-center h-32">
            <p className="text-muted-foreground">
              Failed to load incident details
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StatusIcon = statusIcons[incident.status as keyof typeof statusIcons];

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex-1">
          {isEditing ? (
            <div className="space-y-2">
              <Input
                value={editForm.title}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, title: e.target.value }))
                }
                className="md:text-3xl font-bold bg-transparent border-border focus-visible:ring-0 focus-visible:ring-offset-0"
                placeholder="Enter incident title"
              />
              <p className="text-muted-foreground">Incident #{incident.id}</p>
            </div>
          ) : (
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                {incident.title}
              </h1>
              <p className="text-muted-foreground mt-1">
                Incident #{incident.id}
              </p>
            </div>
          )}
        </div>
        <Badge
          className={`px-3 py-1 ${getIncidentStatusColor(
            incident.status as IncidentStatus
          )}`}
        >
          <StatusIcon className="w-4 h-4 mr-2" />
          {incident.status}
        </Badge>
      </div>

      {/* Main content grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column - Incident details */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <InfoIcon className="w-5 h-5 mr-2" />
                Incident Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-semibold text-foreground mb-2">
                  Description
                </h4>
                {isEditing ? (
                  <Textarea
                    value={editForm.description}
                    onChange={(e) =>
                      setEditForm((prev) => ({
                        ...prev,
                        description: e.target.value,
                      }))
                    }
                    placeholder="Describe the incident details"
                    rows={4}
                    className="resize-none"
                  />
                ) : (
                  <p className="text-muted-foreground leading-relaxed">
                    {incident.description}
                  </p>
                )}
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Application
                  </h4>
                  {isEditing ? (
                    <Select
                      value={editForm.app_id}
                      onValueChange={(value) =>
                        setEditForm((prev) => ({ ...prev, app_id: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select application" />
                      </SelectTrigger>
                      <SelectContent>
                        {applications.map((app) => (
                          <SelectItem key={app.id} value={app.id}>
                            {app.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : (
                    <p className="text-muted-foreground">{applicationName}</p>
                  )}
                </div>
                <div>
                  <h4 className="font-semibold text-foreground mb-2">
                    Organization
                  </h4>
                  <p className="text-muted-foreground">
                    {currentOrg?.name || "Unknown Organization"}
                  </p>
                </div>
              </div>

              <Separator />

              <div>
                <h4 className="font-semibold text-foreground mb-2 flex items-center">
                  <CalendarIcon className="w-4 h-4 mr-2" />
                  Created At
                </h4>
                <p className="text-muted-foreground">
                  {new Date(incident.time).toLocaleString()}
                </p>
              </div>
            </CardContent>
          </Card>

          {isEditing ? (
            <div className="flex gap-2">
              <Button
                onClick={handleSaveChanges}
                disabled={
                  updateIncidentMutation.isPending ||
                  !editForm.title.trim() ||
                  !editForm.description.trim() ||
                  !editForm.app_id
                }
                className="flex-1"
              >
                <SaveIcon className="w-4 h-4 mr-2" />
                {updateIncidentMutation.isPending
                  ? "Saving..."
                  : "Save Changes"}
              </Button>
              <Button
                variant="outline"
                onClick={handleEditToggle}
                className="flex-1"
              >
                <XIcon className="w-4 h-4 mr-2" />
                Cancel
              </Button>
            </div>
          ) : (
            <Button onClick={handleEditToggle}>
              <EditIcon className="w-4 h-4 mr-2" />
              Edit Incident
            </Button>
          )}
        </div>

        {/* Right column - Timeline */}
        <div>
          <Card className="h-fit">
            <CardHeader>
              <CardTitle className="flex items-center">
                <ClockIcon className="w-5 h-5 mr-2" />
                Activity Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[600px] pr-4">
                {logsLoading ? (
                  <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="space-y-2">
                        <Skeleton className="h-4 w-1/2" />
                        <Skeleton className="h-8 w-full" />
                      </div>
                    ))}
                  </div>
                ) : logs.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    <ClockIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No activity logs yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {logs
                      .sort(
                        (a, b) =>
                          new Date(b.created_at).getTime() -
                          new Date(a.created_at).getTime()
                      )
                      .map((log, index) => {
                        const LogStatusIcon =
                          statusIcons[log.status as keyof typeof statusIcons];
                        return (
                          <div key={log.id} className="relative">
                            {/* Timeline line */}
                            {index !== logs.length - 1 && (
                              <div className="absolute left-3 top-8 w-0.5 h-full bg-border" />
                            )}

                            {/* Timeline item */}
                            <div className="flex items-start space-x-3">
                              <div
                                className={`w-6 h-6 rounded-full flex items-center justify-center ${getIncidentStatusColor(
                                  log.status as IncidentStatus
                                )} border-2`}
                              >
                                <LogStatusIcon className="w-3 h-3" />
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <Badge
                                    variant="outline"
                                    className={`text-xs ${getIncidentStatusColor(
                                      log.status as IncidentStatus
                                    )}`}
                                  >
                                    {log.status}
                                  </Badge>
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(
                                      log.created_at
                                    ).toLocaleDateString()}{" "}
                                    {new Date(
                                      log.created_at
                                    ).toLocaleTimeString([], {
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    })}
                                  </span>
                                </div>

                                <p className="text-sm text-foreground mt-1 leading-relaxed">
                                  {log.message}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                )}
              </ScrollArea>

              {/* Add Log Button and Dialog */}
              <Separator className="my-4" />

              <Dialog open={isAddLogOpen} onOpenChange={setIsAddLogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full" variant="outline">
                    <PlusIcon className="w-4 h-4 mr-2" />
                    Add Log Entry
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Log Entry</DialogTitle>
                    <DialogDescription>
                      Add a new status update to this incident's timeline.
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={logForm.status}
                        onValueChange={(value: IncidentStatus) =>
                          setLogForm((prev) => ({ ...prev, status: value }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Reported">Reported</SelectItem>
                          <SelectItem value="Investigating">
                            Investigating
                          </SelectItem>
                          <SelectItem value="Identified">Identified</SelectItem>
                          <SelectItem value="Fixed">Fixed</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message">Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Describe the status update..."
                        value={logForm.message}
                        onChange={(e) =>
                          setLogForm((prev) => ({
                            ...prev,
                            message: e.target.value,
                          }))
                        }
                        rows={4}
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setLogForm({ status: "", message: "" });
                        setIsAddLogOpen(false);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleAddLog}
                      disabled={
                        !logForm.status ||
                        !logForm.message.trim() ||
                        createLogMutation.isPending
                      }
                    >
                      {createLogMutation.isPending
                        ? "Adding..."
                        : "Add Log Entry"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
