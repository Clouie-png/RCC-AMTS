import { useState, useEffect, useMemo, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useTicketFilters } from "@/hooks";

const API_URL = "http://localhost:3001";

export function AddTicketDialog({
  fetchTickets,
  departments,
  categories,
  subCategories,
  users,
  assets,
  pcParts,
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [nextTicketId, setNextTicketId] = useState("000-000-000-001");
  const [currentDate, setCurrentDate] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedPcPartId, setSelectedPcPartId] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("Open");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");

  // Set current date when component mounts
  useEffect(() => {
    const today = new Date();
    const formattedDate = today.toLocaleDateString('en-US', {
      month: '2-digit',
      day: '2-digit',
      year: 'numeric'
    });
    setCurrentDate(formattedDate);
  }, []);

  // Fetch the next ticket ID
  const fetchNextTicketId = useCallback(async () => {
    if (!user?.token) return;
    
    try {
      const response = await axios.get(`${API_URL}/tickets`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      // Get the highest ticket ID and increment by 1
      const tickets = response.data;
      if (tickets && tickets.length > 0) {
        const maxId = Math.max(...tickets.map(ticket => ticket.id || 0));
        const nextId = maxId + 1;
        // Format the ID as 000-000-000-XXX
        const formattedId = `000-000-000-${String(nextId).padStart(3, '0')}`;
        setNextTicketId(formattedId);
      } else {
        // If no tickets exist, start with 001
        setNextTicketId("000-000-000-001");
      }
    } catch (error) {
      console.error("Error fetching next ticket ID:", error);
      // Fallback to default ID
      setNextTicketId("000-000-000-001");
    }
  }, [user?.token]);

  // Fetch next ticket ID when dialog opens
  useEffect(() => {
    if (open) {
      fetchNextTicketId();
    }
  }, [open, fetchNextTicketId]);

  const {
    filteredCategories,
    filteredSubCategories,
    filteredAssets,
    filteredPcParts,
    facultyStaffUsers,
    maintenanceUsers,
  } = useTicketFilters({
    departments,
    categories,
    subCategories,
    assets,
    pcParts,
    users,
    selectedDepartmentId,
    selectedCategoryId,
  });

  const isPcUnitSelected = useMemo(() => {
    return filteredSubCategories.some(
      (subCat) =>
        subCat.name === "PC Unit" &&
        subCat.id?.toString() === selectedSubCategoryId
    );
  }, [filteredSubCategories, selectedSubCategoryId]);

  // Reset dependent fields when parent fields change
  useEffect(() => {
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
    setSelectedAssetId("");
    setSelectedPcPartId("");
  }, [selectedDepartmentId]);

  useEffect(() => {
    setSelectedSubCategoryId("");
    setSelectedAssetId("");
    setSelectedPcPartId("");
  }, [selectedCategoryId]);

  const resetForm = useCallback(() => {
    setSelectedDepartmentId("");
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
    setSelectedUserId("");
    setSelectedAssetId("");
    setSelectedPcPartId("");
    setDescription("");
    setStatus("Open");
    setSelectedTechnicianId("");
  }, []);

  const handleConfirm = async () => {
    if (!selectedDepartmentId || !selectedCategoryId) {
      alert("Please select both department and category.");
      return;
    }

    try {
      await axios.post(
        `${API_URL}/tickets`,
        {
          department_id: parseInt(selectedDepartmentId, 10),
          category_id: parseInt(selectedCategoryId, 10),
          subcategory_id: selectedSubCategoryId
            ? parseInt(selectedSubCategoryId, 10)
            : null,
          user_id: selectedUserId ? parseInt(selectedUserId, 10) : null,
          asset_id: selectedAssetId ? parseInt(selectedAssetId, 10) : null,
          pc_part_id:
            isPcUnitSelected && selectedPcPartId
              ? parseInt(selectedPcPartId, 10)
              : null,
          description: description || null,
          status: status,
          technician_id: selectedTechnicianId
            ? parseInt(selectedTechnicianId, 10)
            : null,
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );

      fetchTickets();
      setOpen(false);
      resetForm();
      alert("Ticket Added Successfully");
    } catch (error) {
      console.error("Error adding ticket:", error);
      alert("Failed to add ticket.");
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(isOpen) => {
        setOpen(isOpen);
        if (!isOpen) resetForm();
      }}
    >
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Add Ticket
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-3xl font-bold">
                ADD TICKET
              </DialogTitle>
              <p className="text-lg text-gray-500">{nextTicketId}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">DATE REPORTED:</p>
              <p className="text-sm">{currentDate}</p>
            </div>
          </div>
        </DialogHeader>

        {/* Upper Section */}
        <div className="grid grid-cols-2 gap-4 py-4 border-b border-gray-300">
          {/* Department */}
          <div>
            <Label className="block mb-2">Department *</Label>
            <Select
              value={selectedDepartmentId}
              onValueChange={setSelectedDepartmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a department" />
              </SelectTrigger>
              <SelectContent>
                {departments
                  ?.filter((dept) => dept.status === "Active")
                  .map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          {/* Category */}
          <div>
            <Label className="block mb-2">Category *</Label>
            <Select
              value={selectedCategoryId}
              onValueChange={setSelectedCategoryId}
              disabled={!selectedDepartmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {filteredCategories?.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* User */}
          <div>
            <Label className="block mb-2">User</Label>
            <Select value={selectedUserId} onValueChange={setSelectedUserId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a user" />
              </SelectTrigger>
              <SelectContent>
                {facultyStaffUsers?.map((user) => (
                  <SelectItem key={user.id} value={user.id.toString()}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Subcategory */}
          <div>
            <Label className="block mb-2">Sub-Category</Label>
            <Select
              value={selectedSubCategoryId}
              onValueChange={setSelectedSubCategoryId}
              disabled={!selectedCategoryId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a sub-category" />
              </SelectTrigger>
              <SelectContent>
                {filteredSubCategories?.map((subCat) => (
                  <SelectItem key={subCat.id} value={subCat.id.toString()}>
                    {subCat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Lower Section */}
        <div className="grid grid-cols-2 gap-4 py-4">
          {/* Technician */}
          <div>
            <Label className="block mb-2">Technician</Label>
            <Select
              value={selectedTechnicianId}
              onValueChange={setSelectedTechnicianId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a technician" />
              </SelectTrigger>
              <SelectContent>
                {maintenanceUsers?.map((tech) => (
                  <SelectItem key={tech.id} value={tech.id.toString()}>
                    {tech.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Asset */}
          <div>
            <Label className="block mb-2">Asset</Label>
            <Select
              value={selectedAssetId}
              onValueChange={setSelectedAssetId}
              disabled={!selectedDepartmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an asset" />
              </SelectTrigger>
              <SelectContent>
                {filteredAssets?.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id.toString()}>
                    {asset.item_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PC Part (conditional) */}
          {isPcUnitSelected && (
            <div>
              <Label className="block mb-2">PC Part</Label>
              <Select
                value={selectedPcPartId}
                onValueChange={setSelectedPcPartId}
                disabled={!selectedDepartmentId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a PC part" />
                </SelectTrigger>
                <SelectContent>
                  {filteredPcParts?.map((pcPart) => (
                    <SelectItem key={pcPart.id} value={pcPart.id.toString()}>
                      {pcPart.part_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Description */}
          <div>
            <Label className="block mb-2">Description</Label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[80px] p-2 border border-gray-300 rounded-md"
              placeholder="Enter ticket description"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Confirm</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
