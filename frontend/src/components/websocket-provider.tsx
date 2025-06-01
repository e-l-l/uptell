"use client";

import { useEffect, useRef } from "react";
import { useAtomValue } from "jotai";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { currentOrgAtom, userAtom } from "@/lib/atoms/auth";
import { connectWebSocket } from "@/lib/socket";

interface WebSocketMessage {
  type: string;
  data: any;
  entity_type?: "application" | "incident" | "incident_log";
  entity_id?: string;
  user_id?: string;
}

export function WebSocketProvider({ children }: { children: React.ReactNode }) {
  const currentOrg = useAtomValue(currentOrgAtom);
  const currentUser = useAtomValue(userAtom);
  const queryClient = useQueryClient();
  const connectionRef = useRef<{
    orgId: string | null;
    cleanup: (() => void) | null;
  }>({
    orgId: null,
    cleanup: null,
  });

  useEffect(() => {
    if (!currentOrg?.id) {
      // Clean up any existing connection when no org
      if (connectionRef.current.cleanup) {
        connectionRef.current.cleanup();
        connectionRef.current = { orgId: null, cleanup: null };
      }
      return;
    }

    // Don't reconnect if we already have a connection for this org
    if (
      connectionRef.current.orgId === currentOrg.id &&
      connectionRef.current.cleanup
    ) {
      return;
    }

    // Clean up any existing connection before creating a new one
    if (connectionRef.current.cleanup) {
      connectionRef.current.cleanup();
    }


    const cleanup = connectWebSocket(
      currentOrg.id,
      (message: WebSocketMessage) => {
        // Only show toasts and invalidate if the message is from another user
        if (message.user_id && currentUser?.id === message.user_id) {
          return;
        }

        // Handle different message types
        switch (message.type) {
          case "new_app":
            toast.success(
              `📱 New application "${message.data.name}" was created by another user`
            );
            queryClient.invalidateQueries({
              queryKey: ["applications"],
            });
            break;

          case "updated_app":
            toast.info(
              `📱 Application "${message.data.name}" was updated by another user`
            );
            queryClient.invalidateQueries({
              queryKey: ["applications"],
            });
            break;

          case "deleted_app":
            toast.success(`📱 An application was deleted by another user`);
            queryClient.invalidateQueries({
              queryKey: ["applications"],
            });
            break;

          case "new_incident":
            toast.error(`🚨 New incident reported: "${message.data.title}"`);
            queryClient.invalidateQueries({
              queryKey: ["incidents"],
            });
            break;

          case "updated_incident":
            toast.info(`📝 Incident "${message.data.title}" was updated`);
            queryClient.invalidateQueries({
              queryKey: ["incidents"],
            });
            // Also invalidate specific incident if we have the ID
            if (message.entity_id) {
              queryClient.invalidateQueries({
                queryKey: ["incident", message.entity_id],
              });
            }
            break;

          case "deleted_incident":
            toast.success(`✅ An incident was resolved and deleted`);
            queryClient.invalidateQueries({
              queryKey: ["incidents"],
            });
            break;

          case "new_log":
            toast.info(`📝 New status update added to an incident`);
            // Invalidate specific incident logs
            if (message.entity_id) {
              queryClient.invalidateQueries({
                queryKey: ["incident-logs", message.entity_id],
              });
              queryClient.invalidateQueries({
                queryKey: ["incident", message.entity_id],
              });
            }
            queryClient.invalidateQueries({
              queryKey: ["incidents"],
            });
            // Also invalidate organization-wide logs cache
            queryClient.invalidateQueries({
              queryKey: ["org-incident-logs"],
            });
            break;

          case "new_maintenance":
            toast.info(`📝 New maintenance was created`);
            queryClient.invalidateQueries({
              queryKey: ["maintenance"],
            });
            break;

          case "updated_maintenance":
            toast.info(`📝 Maintenance was updated`);
            queryClient.invalidateQueries({
              queryKey: ["maintenance"],
            });
            break;

          case "deleted_maintenance":
            toast.success(`✅ Maintenance was deleted`);
            queryClient.invalidateQueries({
              queryKey: ["maintenance"],
            });
            break;
          default:
            console.log("Unknown message type:", message.type);
        }
      }
    );

    // Store the connection info
    connectionRef.current = {
      orgId: currentOrg.id,
      cleanup,
    };

    // Cleanup function for this effect
    return () => {
      if (connectionRef.current.cleanup) {
        connectionRef.current.cleanup();
        connectionRef.current = { orgId: null, cleanup: null };
      }
    };
  }, [currentOrg?.id, currentUser?.id, queryClient]);

  return <>{children}</>;
}
