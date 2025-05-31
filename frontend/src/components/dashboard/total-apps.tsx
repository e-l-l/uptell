import React from "react";
import { Card, CardHeader, CardTitle, CardContent } from "../ui/card";
import { Computer } from "lucide-react";

const TotalAppsCard = ({
  applicationsLoading,
  totalApplications,
}: {
  applicationsLoading: boolean;
  totalApplications: number;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">
          Total Applications
        </CardTitle>
        <Computer className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {applicationsLoading ? "..." : totalApplications}
        </div>
        <p className="text-xs text-muted-foreground">
          {applicationsLoading ? "Loading..." : "Total applications monitored"}
        </p>
      </CardContent>
    </Card>
  );
};

export default TotalAppsCard;
