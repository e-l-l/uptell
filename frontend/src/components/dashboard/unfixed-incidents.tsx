import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { AlertTriangle } from "lucide-react";

const UnfixedIncidentsCard = ({
  incidentsLoading,
  unfixedIncidents,
}: {
  incidentsLoading: boolean;
  unfixedIncidents: number;
}) => {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">Unfixed Incidents</CardTitle>
        <AlertTriangle className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {incidentsLoading ? "..." : unfixedIncidents}
        </div>
        <p className="text-xs text-muted-foreground">
          {incidentsLoading
            ? "Loading..."
            : "Active incidents requiring attention"}
        </p>
      </CardContent>
    </Card>
  );
};

export default UnfixedIncidentsCard;
