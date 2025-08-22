import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Pencil, Loader2 } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const API_URL = "http://localhost:3001";

export function EditUserDialog({ user: currentUser, fetchUsers, departments }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(currentUser.name);
  const [department, setDepartment] = useState(currentUser.department);
  const [role, setRole] = useState(currentUser.role);
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      setName(currentUser.name);
      setDepartment(currentUser.department);
      setRole(currentUser.role);
    }
  }, [open, currentUser]);

  const handleConfirm = async () => {
    if (!name.trim() || !department.trim() || !role.trim()) {
      alert("Please fill in all fields.");
      return;
    }

    setIsLoading(true);
    try {
      await axios.put(
        `${API_URL}/users/${currentUser.id}`,
        { name: name.trim(), department, role },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      alert("Edit Successful");
      setOpen(false);
      fetchUsers();
    } catch (error) {
      console.error("Error updating user:", error);
      alert(`Error updating user: ${error.response.data.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4 text-blue-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update the details for user: {currentUser.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-name" className="text-right">
              User Name
            </Label>
            <Input
              id="edit-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-department" className="text-right">
              Department
            </Label>
            <Select
              onValueChange={setDepartment}
              value={department}
              disabled={isLoading}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments.map((dept) => (
                  <SelectItem
                    key={dept.id}
                    value={dept.name}
                    disabled={dept.status === "Inactive"}
                  >
                    {dept.name}
                    {dept.status === "Inactive" ? " (Inactive)" : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="edit-role" className="text-right">
              Role
            </Label>
            <Select onValueChange={setRole} value={role} disabled={isLoading}>
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="maintenance">Maintenance</SelectItem>
                <SelectItem value="faculty/staff">Faculty/Staff</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button onClick={handleConfirm} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Updating...
              </>
            ) : (
              "Confirm"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}