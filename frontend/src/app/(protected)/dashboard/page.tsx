import { Separator } from "@/components/ui/separator";
import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardPage() {
  return (
        <div className="flex flex-1 flex-col gap-4 p-4">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <p>View your system overview and key metrics.</p>
        </div>
  );
}
