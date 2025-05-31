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
import { Plus, Trash2 } from "lucide-react";
import { Incident, IncidentStatus } from "./types";
import { useState, useEffect } from "react";
import { Toaster } from "@/components/ui/sonner";
import {
  useCreateIncident,
  useCreateIncidentLog,
  useDeleteIncident,
  useIncidents,
} from "./services";
import { useAtomValue } from "jotai";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { IncidentModal } from "./incident-modal";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/spinner";
import { getIncidentStatusColor } from "./utils";



export default function IncidentsPage() {
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const currentOrg = useAtomValue(currentOrgAtom);
  const { data: incidents = [], isLoading: incidentsLoading } = useIncidents(
    currentOrg?.id ?? ""
  );
  const createIncident = useCreateIncident();
  const createIncidentLog = useCreateIncidentLog();
  const deleteIncident = useDeleteIncident();

  const router = useRouter();
  const onRowClick = (incident: Incident) => {
    router.push(`/incidents/${incident.id}`);
  };

  const handleDelete = (incidentId: string) => {
    setIncidentToDelete(incidentId);
  };

  const confirmDelete = () => {
    if (incidentToDelete) {
      deleteIncident.mutate(incidentToDelete, {
        onSuccess: () => {
          toast.success("Incident deleted successfully");
          setIncidentToDelete(null);
        },
        onError: () => {
          toast.error("Failed to delete incident");
        },
      });
      setIncidentToDelete(null);
    }
  };

  const handleSubmit = (data: {
    title: string;
    description: string;
    app_id: string;
    status: IncidentStatus;
  }) => {
    createIncident.mutate(
      {
        title: data.title,
        description: data.description,
        org_id: currentOrg?.id ?? "",
        app_id: data.app_id,
        status: data.status,
      },
      {
        onSuccess: (data) => {
          const log = {
            incident_id: data.id,
            status: data.status,
            message: data.description,
          };
          createIncidentLog.mutate(log, {
            onSuccess: () => {
              toast.success("Incident logged successfully");
              setIsModalOpen(false);
            },
            onError: () => {
              toast.error("Failed to log incident");
            },
          });
        },
      }
    );
  };

  const LoadingState = () => (
    <div className="flex flex-col items-center justify-center pt-16 space-y-4">
      <LoadingSpinner className="w-96" />
      <p className="text-muted-foreground">Loading incidents...</p>
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
            No Incidents Yet
          </h2>
          <p className="text-muted-foreground text-lg">
            Get started by reporting your first incident to track and manage its
            status.
          </p>
        </div>
        <GradButton
          size="lg"
          className="gap-2"
          onClick={() => setIsModalOpen(true)}
          disabled={createIncident.isPending}
        >
          <Plus className="h-5 w-5" />
          Report Incident
        </GradButton>
      </div>
    </div>
  );

  const IncidentsTable = () => {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold">Your Incidents</h2>
            <p className="text-muted-foreground">
              Manage your incidents and their status.
            </p>
          </div>
          <GradButton
            className="gap-2"
            onClick={() => setIsModalOpen(true)}
            disabled={createIncident.isPending}
          >
            <Plus className="h-4 w-4" />
            Report Incident
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
            {incidents.map((incident: Incident) => (
              <TableRow
                key={incident.id}
                onClick={() => onRowClick(incident)}
                className="cursor-pointer"
              >
                <TableCell className="font-medium">{incident.title}</TableCell>
                <TableCell>
                  <span
                    className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getIncidentStatusColor(
                      incident.status as IncidentStatus
                    )}`}
                  >
                    {incident.status}
                  </span>
                </TableCell>
                <TableCell>
                  <AlertDialog
                    open={incidentToDelete === incident.id}
                    onOpenChange={(open) => !open && setIncidentToDelete(null)}
                  >
                    <AlertDialogTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(incident.id);
                        }}
                        disabled={deleteIncident.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This action cannot be undone. This will permanently
                          delete the incident and all its associated data.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={(e) => {
                            e.stopPropagation();
                            confirmDelete();
                          }}
                          disabled={deleteIncident.isPending}
                        >
                          {deleteIncident.isPending ? "Deleting..." : "Delete"}
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-1 flex-col gap-4 p-4">
        {incidentsLoading ? (
          <LoadingState />
        ) : incidents.length === 0 ? (
          <EmptyState />
        ) : (
          <IncidentsTable />
        )}
      </div>
      <IncidentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        isLoading={createIncident.isPending || createIncidentLog.isPending}
      />
      <Toaster />
    </div>
  );
}
