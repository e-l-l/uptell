import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { PublicService } from "@/hooks/usePublicStats";
import { CheckCircle, AlertTriangle, XCircle, Clock } from "lucide-react";

interface PublicServicesListProps {
  orgId: string;
  services: PublicService[];
  isLoading: boolean;
}

const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "operational":
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    case "degraded performance":
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case "partial outage":
      return <AlertTriangle className="h-4 w-4 text-orange-500" />;
    case "major outage":
      return <XCircle className="h-4 w-4 text-red-500" />;
    case "under maintenance":
      return <Clock className="h-4 w-4 text-blue-500" />;
    default:
      return <AlertTriangle className="h-4 w-4 text-gray-500" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "operational":
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
    case "degraded performance":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
    case "partial outage":
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
    case "major outage":
      return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
    case "under maintenance":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300";
  }
};

export function PublicServicesList({
  orgId,
  services,
  isLoading,
}: PublicServicesListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <Skeleton className="h-4 w-4 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-6 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (services.length === 0) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-32">
          <div className="text-center space-y-2">
            <CheckCircle className="h-8 w-8 mx-auto text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No services configured for monitoring.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {services.map((service) => (
        <Card key={service.id} className="transition-colors hover:bg-muted/50">
          <CardContent className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              {getStatusIcon(service.status)}
              <div className="flex flex-col">
                <span className="font-medium">{service.name}</span>
                <span className="text-sm text-muted-foreground">
                  Service ID: {service.id}
                </span>
              </div>
            </div>
            <Badge
              variant="secondary"
              className={getStatusColor(service.status)}
            >
              {service.status}
            </Badge>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
