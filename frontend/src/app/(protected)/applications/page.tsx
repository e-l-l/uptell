"use client";

import { Button } from "@/components/ui/button";
import { GradButton } from "@/components/ui/grad-button";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Application, ApplicationStatus } from "./types";
import { Plus, Pencil, Trash2, Save } from "lucide-react";
import { ApplicationModal } from "./application-modal";

import {
  useApplications,
  useCreateApplication,
  useUpdateApplication,
  useDeleteApplication,
} from "./services";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

import { LoadingSpinner } from "@/components/spinner";
import { getApplicationStatusColor } from "./utils";

export default function ApplicationsPage() {
  const currentOrg = useAtomValue(currentOrgAtom);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedApp, setSelectedApp] = useState<Application | undefined>();
  const [appToDelete, setAppToDelete] = useState<string | null>(null);
  const [modifiedApplications, setModifiedApplications] = useState<
    Record<string, ApplicationStatus>
  >({});

  const { data: applications = [], isLoading: applicationsLoading } =
    useApplications(currentOrg?.id);
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

  const statusOptions: ApplicationStatus[] = [
    "Operational",
    "Degraded Performance",
    "Partial Outage",
    "Major Outage",
    "Unknown",
  ];

  const handleAddEdit = (data: { name: string; status: ApplicationStatus }) => {
    if (selectedApp) {
      updateApplication.mutate({
        id: selectedApp.id,
        data,
      });
    } else {
      createApplication.mutate({
        ...data,
        org_id: currentOrg?.id || "",
      });
    }
    setIsModalOpen(false);
    setSelectedApp(undefined);
  };

  const handleEdit = (app: Application) => {
    setSelectedApp(app);
    setIsModalOpen(true);
  };

  const handleDelete = (appId: string) => {
    setAppToDelete(appId);
  };

  const confirmDelete = () => {
    if (appToDelete) {
      deleteApplication.mutate(appToDelete);
      setAppToDelete(null);
    }
  };

  const handleStatusChange = (appId: string, newStatus: ApplicationStatus) => {
    setModifiedApplications((prev) => ({
      ...prev,
      [appId]: newStatus,
    }));
  };

  const handleSaveChanges = () => {
    Object.entries(modifiedApplications).forEach(([appId, newStatus]) => {
      updateApplication.mutate({
        id: appId,
        data: {
          name: applications.find((app) => app.id === appId)?.name || "",
          status: newStatus,
        },
      });
    });
    setModifiedApplications({});
  };

  const handleSaveSingleApp = (appId: string) => {
    const newStatus = modifiedApplications[appId];
    if (newStatus) {
      updateApplication.mutate({
        id: appId,
        data: {
          name: applications.find((app) => app.id === appId)?.name || "",
          status: newStatus,
        },
      });
      // Remove this app from modified applications
      setModifiedApplications((prev) => {
        const updated = { ...prev };
        delete updated[appId];
        return updated;
      });
    }
  };

  const getDisplayStatus = (app: Application): ApplicationStatus => {
    return modifiedApplications[app.id] || app.status;
  };

  const hasUnsavedChanges = Object.keys(modifiedApplications).length > 0;

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center pt-16 space-y-4">
      <LoadingSpinner className="w-96" />
      <p className="text-muted-foreground">Loading applications...</p>
    </div>
  );

  const EmptyState = () => (
    <div className="flex flex-col items-center justify-start pt-16">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="rounded-full bg-primary/10 p-6">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <div className="space-y-2 flex flex-col items-center gap-2">
          <h2 className="text-5xl font-semibold tracking-tight">
            No Applications Yet
          </h2>
          <p className="text-muted-foreground text-lg">
            Get started by creating your first application to monitor its status
            and configurations.
          </p>
        </div>
        <GradButton
          size="lg"
          className="gap-2"
          onClick={() => setIsModalOpen(true)}
          disabled={createApplication.isPending}
        >
          <Plus className="h-5 w-5" />
          Add Application
        </GradButton>
      </div>
    </div>
  );

  const ApplicationsRows = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Your Applications</h2>
          <p className="text-muted-foreground">
            Manage your applications and their configurations.
          </p>
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <Button
              variant="outline"
              className="gap-2"
              onClick={handleSaveChanges}
              disabled={updateApplication.isPending}
            >
              <Save className="h-4 w-4" />
              Save All Changes
            </Button>
          )}
          <GradButton
            className="gap-2"
            onClick={() => setIsModalOpen(true)}
            disabled={createApplication.isPending}
          >
            <Plus className="h-4 w-4" />
            Add Application
          </GradButton>
        </div>
      </div>

      <div className="space-y-3">
        {applications.map((app: Application) => {
          const displayStatus = getDisplayStatus(app);
          const isModified = modifiedApplications[app.id] !== undefined;

          return (
            <div
              key={app.id}
              className={`flex items-center justify-between p-4 border border-border rounded-lg bg-card hover:bg-accent/50 transition-colors ${
                isModified ? "border-primary/50 bg-primary/5" : ""
              }`}
            >
              <div className="flex items-center gap-6 flex-1">
                <div className="min-w-0 w-48">
                  <h3 className="font-medium text-foreground">{app.name}</h3>
                  {isModified && (
                    <p className="text-xs text-muted-foreground">
                      Status changed
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 flex-1">
                  {statusOptions.map((status) => {
                    const isSelected = displayStatus === status;
                    const statusColorClass = getApplicationStatusColor(status);

                    return (
                      <button
                        key={status}
                        onClick={() => handleStatusChange(app.id, status)}
                        className={`
                          px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200 border
                          ${
                            isSelected
                              ? `${statusColorClass} border-transparent shadow-sm`
                              : "bg-background border-border hover:bg-accent text-muted-foreground hover:text-foreground"
                          }
                        `}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="flex gap-2 ml-4">
                {isModified && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleSaveSingleApp(app.id)}
                    disabled={updateApplication.isPending}
                    className="gap-1"
                  >
                    <Save className="h-3 w-3" />
                    Save
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(app)}
                  disabled={updateApplication.isPending}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <AlertDialog
                  open={appToDelete === app.id}
                  onOpenChange={(open) => !open && setAppToDelete(null)}
                >
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(app.id)}
                      disabled={deleteApplication.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently
                        delete the application and all its associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={confirmDelete}
                        disabled={deleteApplication.isPending}
                      >
                        {deleteApplication.isPending ? "Deleting..." : "Delete"}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-1 flex-col gap-4 p-4">
        {applicationsLoading ? (
          <LoadingState />
        ) : applications.length === 0 ? (
          <EmptyState />
        ) : (
          <ApplicationsRows />
        )}
      </div>
      <ApplicationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        application={selectedApp}
        onSubmit={handleAddEdit}
        isLoading={createApplication.isPending || updateApplication.isPending}
      />
    </div>
  );
}
