import { AppSidebar } from "@/components/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { WebSocketProvider } from "@/components/websocket-provider";

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <WebSocketProvider>{children}</WebSocketProvider>
      </SidebarInset>
    </SidebarProvider>
  );
}
