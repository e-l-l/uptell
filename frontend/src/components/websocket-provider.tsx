"use client";

import { useEffect } from "react";
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

  useEffect(() => {
    if (!currentOrg?.id) return;

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

    return cleanup;
  }, [currentOrg?.id, currentUser?.id, queryClient]);

  return <>{children}</>;
}
