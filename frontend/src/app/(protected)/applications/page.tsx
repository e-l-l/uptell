"use client";

import { Button } from "@/components/ui/button";
import { GradButton } from "@/components/ui/grad-button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { useAtomValue } from "jotai";
import { useState } from "react";
import { Application, ApplicationStatus } from "./types";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { ApplicationModal } from "./application-modal";
import { Toaster } from "@/components/ui/sonner";
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

  const { data: applications = [], isLoading: applicationsLoading } =
    useApplications(currentOrg?.id);
  const createApplication = useCreateApplication();
  const updateApplication = useUpdateApplication();
  const deleteApplication = useDeleteApplication();

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

  const ApplicationsTable = () => (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-semibold">Your Applications</h2>
          <p className="text-muted-foreground">
            Manage your applications and their configurations.
          </p>
        </div>
        <GradButton
          className="gap-2"
          onClick={() => setIsModalOpen(true)}
          disabled={createApplication.isPending}
        >
          <Plus className="h-4 w-4" />
          Add Application
        </GradButton>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {applications.map((app: Application) => (
            <TableRow key={app.id}>
              <TableCell className="font-medium">{app.name}</TableCell>
              <TableCell>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getApplicationStatusColor(
                    app.status as ApplicationStatus
                  )}`}
                >
                  {app.status}
                </span>
              </TableCell>
              <TableCell>
                <div className="flex gap-2">
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
                          {deleteApplication.isPending
                            ? "Deleting..."
                            : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
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
          <ApplicationsTable />
        )}
      </div>
      <ApplicationModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        application={selectedApp}
        onSubmit={handleAddEdit}
        isLoading={createApplication.isPending || updateApplication.isPending}
      />
      <Toaster />
    </div>
  );
}
