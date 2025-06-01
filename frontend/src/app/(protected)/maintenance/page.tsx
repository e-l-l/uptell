"use client";

import {
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { GradButton } from "@/components/ui/grad-button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Pencil, Filter } from "lucide-react";
import { Maintenance } from "./types";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  useCreateMaintenance,
  useUpdateMaintenance,
  useDeleteMaintenance,
  useMaintenance,
  useMaintenanceByApp,
} from "./services";
import { useAtomValue } from "jotai";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { MaintenanceModal } from "./maintenance-modal";
import { LoadingSpinner } from "@/components/spinner";
import {
  formatMaintenanceDate,
  getMaintenanceStatus,
  getMaintenanceStatusColor,
} from "./utils";
import { useApplications } from "../applications/services";

export default function MaintenancePage() {
  const [maintenanceToDelete, setMaintenanceToDelete] = useState<string | null>(
    null
  );
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedMaintenance, setSelectedMaintenance] = useState<
    Maintenance | undefined
  >();
  const [selectedAppFilter, setSelectedAppFilter] = useState<string>("all");

  const currentOrg = useAtomValue(currentOrgAtom);
  const { data: applications = [] } = useApplications(currentOrg?.id);

  // Use different queries based on filter
  const { data: allMaintenance = [], isLoading: allMaintenanceLoading } =
    useMaintenance(currentOrg?.id ?? "");
  const {
    data: filteredMaintenance = [],
    isLoading: filteredMaintenanceLoading,
  } = useMaintenanceByApp(selectedAppFilter !== "all" ? selectedAppFilter : "");

  const isLoading =
    selectedAppFilter === "all"
      ? allMaintenanceLoading
      : filteredMaintenanceLoading;
  const maintenanceData =
    selectedAppFilter === "all" ? allMaintenance : filteredMaintenance;

  const createMaintenance = useCreateMaintenance();
  const updateMaintenance = useUpdateMaintenance();
  const deleteMaintenance = useDeleteMaintenance();

  const getApplicationName = (appId: string) => {
    const app = applications.find((a) => a.id === appId);
    return app?.name || "Unknown App";
  };

  const handleDelete = (maintenanceId: string) => {
    setMaintenanceToDelete(maintenanceId);
  };

  const confirmDelete = () => {
    if (maintenanceToDelete) {
      deleteMaintenance.mutate(maintenanceToDelete, {
        onSuccess: () => {
          setMaintenanceToDelete(null);
        },
        onError: () => {
          setMaintenanceToDelete(null);
        },
      });
    }
  };

  const handleEdit = (maintenance: Maintenance) => {
    setSelectedMaintenance(maintenance);
    setIsModalOpen(true);
  };

  const handleSubmit = (data: {
    title: string;
    app_id: string;
    start_time: string;
    end_time: string;
  }) => {
    if (selectedMaintenance) {
      updateMaintenance.mutate(
        {
          id: selectedMaintenance.id,
          data,
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
            setSelectedMaintenance(undefined);
          },
        }
      );
    } else {
      createMaintenance.mutate(
        {
          ...data,
          org_id: currentOrg?.id ?? "",
        },
        {
          onSuccess: () => {
            setIsModalOpen(false);
          },
        }
      );
    }
  };

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center pt-16 space-y-4">
      <LoadingSpinner className="w-96" />
      <p className="text-muted-foreground">Loading maintenance schedules...</p>
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
            No Maintenance Scheduled
          </h2>
          <p className="text-muted-foreground text-lg">
            Get started by scheduling your first maintenance window to keep your
            applications up to date.
          </p>
        </div>
        <GradButton
          size="lg"
          className="gap-2"
          onClick={() => setIsModalOpen(true)}
          disabled={createMaintenance.isPending}
        >
          <Plus className="h-5 w-5" />
          Schedule Maintenance
        </GradButton>
      </div>
    </div>
  );

  const FilteredEmptyState = () => (
    <div className="flex flex-col items-center justify-center py-16 space-y-4">
      <div className="rounded-full bg-muted p-6">
        <Filter className="h-6 w-6 text-muted-foreground" />
      </div>
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold">No maintenance found</h3>
        <p className="text-muted-foreground">
          No maintenance schedules found for the selected application.
        </p>
      </div>
    </div>
  );

  const MaintenanceTable = () => {
    return (
      <div className="space-y-4 w-full">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Maintenance Schedule</h2>
            <p className="text-muted-foreground">
              Manage your scheduled maintenance windows.
            </p>
          </div>
          <div className="flex gap-2">
            <Select
              value={selectedAppFilter}
              onValueChange={setSelectedAppFilter}
            >
              <SelectTrigger className="w-[200px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Filter by app" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Applications</SelectItem>
                {applications.map((app) => (
                  <SelectItem key={app.id} value={app.id}>
                    {app.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <GradButton
              className="gap-2"
              onClick={() => setIsModalOpen(true)}
              disabled={createMaintenance.isPending}
            >
              <Plus className="h-4 w-4" />
              Schedule Maintenance
            </GradButton>
          </div>
        </div>

        {maintenanceData.length === 0 ? (
          <FilteredEmptyState />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Application</TableHead>
                <TableHead>Start Time</TableHead>
                <TableHead>End Time</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {maintenanceData.map((maintenance: Maintenance) => {
                const status = getMaintenanceStatus(maintenance);
                return (
                  <TableRow key={maintenance.id}>
                    <TableCell className="font-medium">
                      {maintenance.title}
                    </TableCell>
                    <TableCell>
                      {getApplicationName(maintenance.app_id)}
                    </TableCell>
                    <TableCell>
                      {formatMaintenanceDate(maintenance.start_time)}
                    </TableCell>
                    <TableCell>
                      {formatMaintenanceDate(maintenance.end_time)}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getMaintenanceStatusColor(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(maintenance)}
                          disabled={updateMaintenance.isPending}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog
                          open={maintenanceToDelete === maintenance.id}
                          onOpenChange={(open) =>
                            !open && setMaintenanceToDelete(null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(maintenance.id)}
                              disabled={deleteMaintenance.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the maintenance schedule.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={confirmDelete}
                                disabled={deleteMaintenance.isPending}
                              >
                                {deleteMaintenance.isPending
                                  ? "Deleting..."
                                  : "Delete"}
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    );
  };

  if (isLoading) {
    return <LoadingState />;
  }

  return (
    <div className="w-full p-4">
      {allMaintenance.length === 0 && selectedAppFilter === "all" ? (
        <EmptyState />
      ) : (
        <MaintenanceTable />
      )}

      <MaintenanceModal
        open={isModalOpen}
        onOpenChange={(open) => {
          setIsModalOpen(open);
          if (!open) {
            setSelectedMaintenance(undefined);
          }
        }}
        maintenance={selectedMaintenance}
        onSubmit={handleSubmit}
        isLoading={createMaintenance.isPending || updateMaintenance.isPending}
      />

      <Toaster />
    </div>
  );
}
