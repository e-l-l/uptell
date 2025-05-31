import { useState } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { useCreateOrganization } from "@/lib/hooks/use-user-organizations";
import { useAtom } from "jotai";
import { currentOrgAtom } from "@/lib/atoms/auth";

interface CreateOrganizationDialogProps {
  userId: string;
}

export function CreateOrganizationDialog({
  userId,
}: CreateOrganizationDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [orgName, setOrgName] = useState("");
  const createOrganization = useCreateOrganization();
  const [, setCurrentOrg] = useAtom(currentOrgAtom);

  const handleCreateOrganization = (e: React.FormEvent) => {
    e.preventDefault();
    if (!orgName.trim()) return;

    try {
      createOrganization.mutate(
        {
          name: orgName.trim(),
          userId,
        },
        {
          onSuccess: (data) => {
            setOrgName("");
            setCurrentOrg(data.organization);
            setIsOpen(false);
          },
        }
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
          <Plus className="h-4 w-4" />
          Create New Organization
        </DropdownMenuItem>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Organization</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleCreateOrganization} className="space-y-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="orgName">Organization Name</Label>
            <Input
              id="orgName"
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Enter organization name"
              required
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={createOrganization.isPending}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={createOrganization.isPending || !orgName.trim()}
            >
              {createOrganization.isPending ? "Creating..." : "Create"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
