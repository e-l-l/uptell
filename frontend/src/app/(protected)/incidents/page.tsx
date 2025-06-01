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
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Plus, Trash2, Filter, X } from "lucide-react";
import { Incident, IncidentStatus } from "./types";
import { useState, useEffect } from "react";

import { useCreateIncident, useDeleteIncident, useIncidents } from "./services";
import { useAtomValue } from "jotai";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { IncidentModal } from "./incident-modal";

import { useRouter } from "next/navigation";
import { LoadingSpinner } from "@/components/spinner";
import { getIncidentStatusColor } from "./utils";
import { useApplications } from "../applications/services";

export default function IncidentsPage() {
  const [incidentToDelete, setIncidentToDelete] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedAppId, setSelectedAppId] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  const currentOrg = useAtomValue(currentOrgAtom);
  const pageLimit = 10;

  const { data: incidentsData, isLoading: incidentsLoading } = useIncidents(
    currentOrg?.id ?? "",
    currentPage,
    pageLimit,
    selectedAppId || undefined
  );

  const { data: applications = [] } = useApplications(currentOrg?.id);

  const incidents = incidentsData?.data || [];
  const pagination = incidentsData?.pagination || {
    total: 0,
    page: 1,
    limit: pageLimit,
    total_pages: 1,
  };
  const createIncident = useCreateIncident();
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
          setIncidentToDelete(null);
        },
        onError: () => {
          setIncidentToDelete(null);
        },
      });
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
        onSuccess: () => {
          setIsModalOpen(false);
        },
      }
    );
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleAppFilterChange = (appId: string) => {
    setSelectedAppId(appId === "all" ? "" : appId);
    setCurrentPage(1); // Reset to first page when filter changes
  };

  const clearFilters = () => {
    setSelectedAppId("");
    setCurrentPage(1);
    setShowFilters(false);
  };

  const selectedAppName = applications.find(
    (app) => app.id === selectedAppId
  )?.name;

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

  const FilteredEmptyState = () => (
    <div className="flex flex-col items-center justify-start pt-16">
      <div className="flex flex-col items-center gap-6 max-w-md text-center">
        <div className="rounded-full bg-muted/50 p-6">
          <Filter className="h-6 w-6 text-muted-foreground" />
        </div>
        <div className="space-y-2 flex flex-col items-center gap-2">
          <h2 className="text-3xl font-semibold tracking-tight">
            No Incidents Found
          </h2>
          <p className="text-muted-foreground text-lg">
            No incidents match your current filters. Try adjusting your search
            criteria or clear the filters.
          </p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            size="lg"
            className="gap-2"
            onClick={clearFilters}
          >
            <X className="h-5 w-5" />
            Clear Filters
          </Button>
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
    </div>
  );

  const FilterSection = () => (
    <div className="border border-border rounded-lg p-4 space-y-4 bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium">Filter Incidents</h3>
        <Button variant="ghost" size="sm" onClick={() => setShowFilters(false)}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Application</label>
          <Select
            value={selectedAppId || "all"}
            onValueChange={handleAppFilterChange}
          >
            <SelectTrigger>
              <SelectValue placeholder="All applications" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All applications</SelectItem>
              {applications.map((app) => (
                <SelectItem key={app.id} value={app.id}>
                  {app.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedAppId && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {selectedAppId && (
            <div className="flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary rounded-md text-xs">
              App: {selectedAppName}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-primary/20"
                onClick={() => handleAppFilterChange("all")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={clearFilters}>
            Clear all
          </Button>
        </div>
      )}
    </div>
  );

  const PaginationSection = () => {
    if (pagination.total_pages <= 1) return null;

    const renderPaginationItems = () => {
      const items = [];
      const currentPage = pagination.page;
      const totalPages = pagination.total_pages;

      // Always show first page
      items.push(
        <PaginationItem key={1}>
          <PaginationLink
            onClick={() => handlePageChange(1)}
            isActive={currentPage === 1}
          >
            1
          </PaginationLink>
        </PaginationItem>
      );

      // Show ellipsis if current page is far from start
      if (currentPage > 3) {
        items.push(
          <PaginationItem key="ellipsis1">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Show pages around current page
      for (
        let i = Math.max(2, currentPage - 1);
        i <= Math.min(totalPages - 1, currentPage + 1);
        i++
      ) {
        items.push(
          <PaginationItem key={i}>
            <PaginationLink
              onClick={() => handlePageChange(i)}
              isActive={currentPage === i}
            >
              {i}
            </PaginationLink>
          </PaginationItem>
        );
      }

      // Show ellipsis if current page is far from end
      if (currentPage < totalPages - 2) {
        items.push(
          <PaginationItem key="ellipsis2">
            <PaginationEllipsis />
          </PaginationItem>
        );
      }

      // Always show last page if there's more than one page
      if (totalPages > 1) {
        items.push(
          <PaginationItem key={totalPages}>
            <PaginationLink
              onClick={() => handlePageChange(totalPages)}
              isActive={currentPage === totalPages}
            >
              {totalPages}
            </PaginationLink>
          </PaginationItem>
        );
      }

      return items;
    };

    return (
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {(pagination.page - 1) * pagination.limit + 1} to{" "}
          {Math.min(pagination.page * pagination.limit, pagination.total)} of{" "}
          {pagination.total} incidents
        </p>
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() =>
                  handlePageChange(Math.max(1, pagination.page - 1))
                }
                className={
                  pagination.page <= 1 ? "pointer-events-none opacity-50" : ""
                }
              />
            </PaginationItem>
            {renderPaginationItems()}
            <PaginationItem>
              <PaginationNext
                onClick={() =>
                  handlePageChange(
                    Math.min(pagination.total_pages, pagination.page + 1)
                  )
                }
                className={
                  pagination.page >= pagination.total_pages
                    ? "pointer-events-none opacity-50"
                    : ""
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    );
  };

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
          <div className="flex gap-2">
            <Button
              variant="outline"
              className="gap-2"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <GradButton
              className="gap-2"
              onClick={() => setIsModalOpen(true)}
              disabled={createIncident.isPending}
            >
              <Plus className="h-4 w-4" />
              Report Incident
            </GradButton>
          </div>
        </div>

        {showFilters && <FilterSection />}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Application</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {incidents.map((incident: Incident) => {
              const applicationName =
                applications.find((app) => app.id === incident.app_id)?.name ||
                "Unknown App";

              return (
                <TableRow
                  key={incident.id}
                  onClick={() => onRowClick(incident)}
                  className="cursor-pointer"
                >
                  <TableCell className="font-medium">
                    {incident.title}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {applicationName}
                  </TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getIncidentStatusColor(
                        incident.status as IncidentStatus
                      )}`}
                    >
                      {incident.status}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(incident.time).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
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
                            {deleteIncident.isPending
                              ? "Deleting..."
                              : "Delete"}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>

        <PaginationSection />
      </div>
    );
  };

  // Check if any filters are currently active
  const hasActiveFilters = selectedAppId;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-1 flex-col gap-4 p-4">
        {incidentsLoading ? (
          <LoadingState />
        ) : incidents.length === 0 ? (
          hasActiveFilters ? (
            <FilteredEmptyState />
          ) : (
            <EmptyState />
          )
        ) : (
          <IncidentsTable />
        )}
      </div>
      <IncidentModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        onSubmit={handleSubmit}
        isLoading={createIncident.isPending}
      />
    </div>
  );
}
