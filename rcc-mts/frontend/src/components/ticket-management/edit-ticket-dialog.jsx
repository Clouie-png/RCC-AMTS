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
import { Pencil } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useTicketFilters } from "@/hooks";

const API_URL = "http://localhost:3001";

export function EditTicketDialog({ ticket, fetchTickets, departments, categories, subCategories, users, assets, pcParts }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState("");
  
  // Initialize state with default values
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(ticket?.department_id?.toString() || "");
  const [selectedCategoryId, setSelectedCategoryId] = useState(ticket?.category_id?.toString() || "");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState(ticket?.subcategory_id?.toString() || "");
  const [selectedUserId, setSelectedUserId] = useState(ticket?.user_id?.toString() || "");
  const [selectedAssetId, setSelectedAssetId] = useState(ticket?.asset_id?.toString() || "");
  const [selectedPcPartId, setSelectedPcPartId] = useState(ticket?.pc_part_id?.toString() || "");
  const [description, setDescription] = useState(ticket?.description || "");
  const [status, setStatus] = useState(ticket?.status || "Open");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState(ticket?.technician_id?.toString() || "");

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

  const {
    filteredCategories,
    filteredSubCategories,
    filteredAssets,
    filteredPcParts,
    facultyStaffUsers,
    maintenanceUsers
  } = useTicketFilters({
    departments,
    categories,
    subCategories,
    assets,
    pcParts,
    users,
    selectedDepartmentId,
    selectedCategoryId
  });

  const isPcUnitSelected = useMemo(() => {
    return filteredSubCategories.some(
      (subCat) => subCat.name === "PC Unit" && subCat.id?.toString() === selectedSubCategoryId
    );
  }, [filteredSubCategories, selectedSubCategoryId]);

  // Reset form when dialog opens or ticket changes
  useEffect(() => {
    if (open && ticket) {
      setSelectedDepartmentId(ticket.department_id?.toString() || "");
      setSelectedCategoryId(ticket.category_id?.toString() || "");
      setSelectedSubCategoryId(ticket.subcategory_id?.toString() || "");
      setSelectedUserId(ticket.user_id?.toString() || "");
      setSelectedAssetId(ticket.asset_id?.toString() || "");
      setSelectedPcPartId(ticket.pc_part_id?.toString() || "");
      setDescription(ticket.description || "");
      setStatus(ticket.status || "Open");
      setSelectedTechnicianId(ticket.technician_id?.toString() || "");
    }
  }, [open, ticket]);

  // Reset dependent fields when department changes
  useEffect(() => {
    if (ticket && selectedDepartmentId !== (ticket.department_id?.toString() || "")) {
      setSelectedAssetId("");
      setSelectedPcPartId("");
    }
  }, [selectedDepartmentId, ticket?.department_id]);

  // Reset dependent fields when category changes
  useEffect(() => {
    if (ticket && selectedCategoryId !== (ticket.category_id?.toString() || "")) {
      setSelectedSubCategoryId("");
    }
  }, [selectedCategoryId, ticket?.category_id]);

  const hasChanged = useCallback((newValue, originalValue) => {
    // Handle null/undefined cases
    if ((newValue === "" || newValue === null || newValue === undefined) && 
        (originalValue === null || originalValue === undefined)) {
      return false;
    }
    
    return newValue !== (originalValue?.toString() || "");
  }, []);

  const handleConfirm = async () => {
    try {
      const originalStatus = ticket?.status;
      const newStatus = status;

      // Prepare the data to send, only including fields that should be updated
      const updateData = {};
      
      if (hasChanged(selectedDepartmentId, ticket?.department_id)) {
        updateData.department_id = selectedDepartmentId ? parseInt(selectedDepartmentId, 10) : null;
      }
      
      if (hasChanged(selectedCategoryId, ticket?.category_id)) {
        updateData.category_id = selectedCategoryId ? parseInt(selectedCategoryId, 10) : null;
      }
      
      if (hasChanged(selectedSubCategoryId, ticket?.subcategory_id)) {
        updateData.subcategory_id = selectedSubCategoryId ? parseInt(selectedSubCategoryId, 10) : null;
      }
      
      if (hasChanged(selectedUserId, ticket?.user_id)) {
        updateData.user_id = selectedUserId ? parseInt(selectedUserId, 10) : null;
      }
      
      if (hasChanged(selectedAssetId, ticket?.asset_id)) {
        updateData.asset_id = selectedAssetId ? parseInt(selectedAssetId, 10) : null;
      }
      
      if (hasChanged(selectedPcPartId, ticket?.pc_part_id)) {
        updateData.pc_part_id = selectedPcPartId ? parseInt(selectedPcPartId, 10) : null;
      }
      
      if (description !== (ticket?.description || "")) {
        updateData.description = description || null;
      }
      
      if (newStatus !== (ticket?.status || "Open")) {
        updateData.status = newStatus;
      }
      
      if (hasChanged(selectedTechnicianId, ticket?.technician_id)) {
        updateData.technician_id = selectedTechnicianId ? parseInt(selectedTechnicianId, 10) : null;
      }

      // Only make the request if there's something to update
      if (Object.keys(updateData).length > 0) {
        await axios.put(
          `${API_URL}/tickets/${ticket.id}`,
          updateData,
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
      }

      // If status changed to "In Progress" or "Closed", send a notification
      if ((newStatus === "In Progress" || newStatus === "Closed") && newStatus !== originalStatus) {
        const message = `Ticket #${ticket.id} has been updated to "${newStatus}" by ${user.name}.`;
        try {
          await axios.post(
            `${API_URL}/notifications/broadcast`,
            {
              ticket_id: ticket.id,
              message: message,
            },
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
          // Optionally, inform the user that the notification failed to send
          alert("Ticket updated, but failed to send notification.");
        }
      }
      
      fetchTickets();
      setOpen(false);
      alert("Ticket Updated Successfully");
    } catch (error) {
      console.error("Error editing ticket:", error);
      alert("Failed to edit ticket.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4 text-blue-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-start">
            <div>
              <DialogTitle className="text-3xl font-bold">
                EDIT TICKET
              </DialogTitle>
              <p className="text-lg text-gray-500">T-{String(ticket?.id || 0).padStart(3, "0")}</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">DATE REPORTED:</p>
              <p className="text-sm">{currentDate}</p>
            </div>
          </div>
          <DialogDescription>
            Update details for ticket ID: T-{String(ticket?.id || 0).padStart(3, "0")}.
          </DialogDescription>
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
                {departments?.map((dept) => (
                  <SelectItem
                    key={dept.id}
                    value={dept.id.toString()}
                    disabled={dept.status === "Inactive"}
                  >
                    {dept.name}
                    {dept.status === "Inactive" ? " (Inactive)" : ""}
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

          {/* Status */}
          <div>
            <Label className="block mb-2">Status</Label>
            <Select onValueChange={setStatus} value={status}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Open">Open</SelectItem>
                <SelectItem value="In Progress">In Progress</SelectItem>
                <SelectItem value="Closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>

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