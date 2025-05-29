"use client";

import {
  AlertDialogHeader,
  AlertDialogFooter,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Pencil, Plus, Trash2 } from "lucide-react";
import { Incident, IncidentStatus } from "./types";
import { useState } from "react";
import { Toaster } from "@/components/ui/sonner";
import { useIncidents } from "./services";
import { useAtomValue } from "jotai";
import { currentOrgAtom } from "@/lib/atoms/auth";

const getStatusColor = (status: IncidentStatus) => {
  switch (status) {
    case "Reported":
      return "bg-green-100 text-green-800";
    case "Investigating":
      return "bg-yellow-100 text-yellow-800";
    case "Identified":
      return "bg-orange-100 text-orange-800";
    case "Fixed":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

export default function IncidentsPage() {
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [selectedIncident, setSelectedIncident] = useState<
    Incident | undefined
  >();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const currentOrg = useAtomValue(currentOrgAtom);
  const { data: incidents = [] } = useIncidents(currentOrg?.id ?? "");

  const handleEdit = (incident: Incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const handleDelete = (incidentId: string) => {
    setIncidentToDelete(incidentId);
  };

  const confirmDelete = () => {
    if (incidentToDelete) {
      // TODO: Implement delete mutation
      setIncidentToDelete(null);
    }
  };

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
          <GradButton className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Report Incident
          </GradButton>
        </div>
        <Card>
          <CardContent className="p-0">
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
                  <TableRow key={incident.id}>
                    <TableCell className="font-medium">
                      {incident.name}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                          incident.status as IncidentStatus
                        )}`}
                      >
                        {incident.status}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEdit(incident)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <AlertDialog
                          open={incidentToDelete === incident.id}
                          onOpenChange={(open) =>
                            !open && setIncidentToDelete(null)
                          }
                        >
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDelete(incident.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete the incident and all its
                                associated data.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={confirmDelete}>
                                Delete
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
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-1 flex-col gap-4 p-4">
        {incidents.length === 0 ? <EmptyState /> : <IncidentsTable />}
      </div>
      <Toaster />
    </div>
  );
}
