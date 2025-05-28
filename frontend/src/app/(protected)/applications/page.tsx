"use client";

import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";
import { apiClient } from "@/lib/api-client";
import { currentOrgAtom } from "@/lib/atoms/auth";
import { useQuery } from "@tanstack/react-query";
import { useAtomValue } from "jotai";

export default function ApplicationsPage() {
  const currentOrg = useAtomValue(currentOrgAtom);
  const { data: applications } = useQuery({
    queryKey: ["applications"],
    queryFn: () => apiClient.get("/applications", { org_id: currentOrg?.id }),
    enabled: !!currentOrg?.id,
  });
  return (
    <SidebarInset>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4">
        <h1 className="text-2xl font-bold">Applications</h1>
        <p>Manage your applications and their configurations.</p>
      </div>
    </SidebarInset>
  );
}
