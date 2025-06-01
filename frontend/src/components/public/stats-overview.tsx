import React from "react";
import { PublicStatsOverview as PublicStatsOverviewType } from "@/hooks/usePublicStats";

interface PublicStatsOverviewProps {
  data: PublicStatsOverviewType | null;
  isLoading: boolean;
}

export function PublicStatsOverview({
  data,
  isLoading,
}: PublicStatsOverviewProps) {
  // This component can be expanded later for additional overview functionality
  // For now, it's a simple wrapper that could contain summary cards or charts

  if (isLoading || !data) {
    return null;
  }

  return (
    <div className="space-y-4">
      {/* This component can be expanded with additional overview features */}
      <div className="text-sm text-muted-foreground">
        Organization: {data.organization.name}
      </div>
    </div>
  );
}
