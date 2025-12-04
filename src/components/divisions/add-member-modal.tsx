"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { UserPlus, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { assignUserToDivision, getUsersNotInDivision } from "@/actions/user";

interface User {
  id: string;
  name: string;
  nameLocal: string | null;
  email: string;
  role: string;
  division: {
    nameLocal: string;
  };
}

interface AddMemberModalProps {
  divisionId: string;
  divisionName: string;
}

export default function AddMemberModal({
  divisionId,
  divisionName,
}: AddMemberModalProps) {
  const t = useTranslations();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [open, setOpen] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch users not in this division when modal opens
  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open]);

  // Filter users based on search query
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredUsers(users);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = users.filter(
        (user) =>
          user.name.toLowerCase().includes(query) ||
          user.email.toLowerCase().includes(query) ||
          user.nameLocal?.toLowerCase().includes(query)
      );
      setFilteredUsers(filtered);
    }
  }, [searchQuery, users]);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const result = await getUsersNotInDivision(divisionId);
      if (result.success && result.data) {
        setUsers(result.data);
        setFilteredUsers(result.data);
      } else {
        toast.error(result.error || "Failed to fetch users");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedUserId) {
      toast.error("Please select a user");
      return;
    }

    startTransition(async () => {
      try {
        const result = await assignUserToDivision(selectedUserId, divisionId);
        if (result.success) {
          toast.success(`${result.data?.userName} assigned to ${divisionName}`);
          setOpen(false);
          setSelectedUserId(null);
          setSearchQuery("");
          router.refresh();
        } else {
          toast.error(result.error || "Failed to assign user");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
        console.error(error);
      }
    });
  };

  const getRoleBadge = (role: string) => {
    const roleMap: Record<string, { label: string; className: string }> = {
      SUPER_ADMIN: {
        label: "Super Admin",
        className:
          "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
      },
      ADMIN: {
        label: "Admin",
        className:
          "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
      },
      APPROVER: {
        label: "Approver",
        className:
          "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
      },
      STAFF: {
        label: "Staff",
        className:
          "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
      },
      VIEWER: {
        label: "Viewer",
        className:
          "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200",
      },
    };

    const config = roleMap[role] || roleMap.STAFF;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          Add Member
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>Add Member to {divisionName}</DialogTitle>
          <DialogDescription>
            Select a user from another division to add to this division.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          {/* User List */}
          <div className="flex-1 overflow-y-auto border rounded-lg">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchQuery ? "No users found" : "No users available"}
              </div>
            ) : (
              <div className="divide-y">
                {filteredUsers.map((user) => (
                  <div
                    key={user.id}
                    onClick={() => setSelectedUserId(user.id)}
                    className={`p-4 cursor-pointer transition-colors hover:bg-accent/50 ${
                      selectedUserId === user.id ? "bg-accent" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{user.name}</p>
                        {user.nameLocal && (
                          <p className="text-sm text-muted-foreground truncate">
                            {user.nameLocal}
                          </p>
                        )}
                        <p className="text-sm text-muted-foreground truncate">
                          {user.email}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Current: {user.division.nameLocal}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        {getRoleBadge(user.role)}
                        {selectedUserId === user.id && (
                          <Badge variant="default" className="text-xs">
                            Selected
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              setOpen(false);
              setSelectedUserId(null);
              setSearchQuery("");
            }}
            disabled={isPending}
          >
            Cancel
          </Button>
          <Button
            onClick={handleAssign}
            disabled={!selectedUserId || isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Add Member
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
