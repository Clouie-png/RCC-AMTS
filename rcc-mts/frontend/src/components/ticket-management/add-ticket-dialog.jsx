import { useState, useEffect, useMemo, useCallback, useRef } from "react";
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

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function AddTicketDialog({
  fetchTickets,
  departments,
  categories,
  subCategories,
  users,
  assets,
  pcParts,
  statuses,
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [selectedAssetId, setSelectedAssetId] = useState("");
  const [selectedPcPartId, setSelectedPcPartId] = useState("");
  const [description, setDescription] = useState("");
  const [selectedStatusId, setSelectedStatusId] = useState("");
  const [selectedTechnicianId, setSelectedTechnicianId] = useState("");
  const [assetSpecificPcParts, setAssetSpecificPcParts] = useState([]);
  const isSettingAssetRef = useRef(false);

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
    selectedAssetId,
  });

  const isPcUnitSelected = useMemo(() => {
    if (!selectedSubCategoryId) return false;
    
    // Find the selected sub-category
    const selectedSubCategory = subCategories?.find(
      (subCat) => subCat.id?.toString() === selectedSubCategoryId
    );
    
    // Check if the selected sub-category name contains "PC Unit" (case insensitive)
    return selectedSubCategory && 
      selectedSubCategory.name.toLowerCase().includes("pc unit");
  }, [subCategories, selectedSubCategoryId]);

  // Filter assets to only show those with PC Unit sub-category when PC Unit is selected
  const pcUnitFilteredAssets = useMemo(() => {
    if (!isPcUnitSelected) return filteredAssets;
    
    // Find the sub-category object for "PC Unit"
    const pcUnitSubCategory = subCategories?.find(
      (subCat) => subCat.name.toLowerCase().includes("pc unit")
    );
    
    if (!pcUnitSubCategory) return filteredAssets;
    
    // Filter assets that belong to the PC Unit sub-category
    return assets?.filter(
      (asset) => asset.sub_category_id === pcUnitSubCategory.id
    ) || [];
  }, [assets, filteredAssets, isPcUnitSelected, subCategories]);

  // Reset dependent fields when parent fields change
  useEffect(() => {
    if (!isSettingAssetRef.current) {
      setSelectedCategoryId("");
      setSelectedSubCategoryId("");
      setSelectedAssetId("");
      setSelectedPcPartId("");
      setAssetSpecificPcParts([]);
    }
  }, [selectedDepartmentId]);

  useEffect(() => {
    if (!isSettingAssetRef.current) {
      setSelectedSubCategoryId("");
      setSelectedAssetId("");
      setSelectedPcPartId("");
      setAssetSpecificPcParts([]);
    }
  }, [selectedCategoryId]);

  const resetForm = useCallback(() => {
    isSettingAssetRef.current = false;
    setSelectedDepartmentId("");
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
    setSelectedUserId("");
    setSelectedAssetId("");
    setSelectedPcPartId("");
    setDescription("");
    setSelectedStatusId("");
    setSelectedTechnicianId("");
    setAssetSpecificPcParts([]);
  }, []);

  const handleConfirm = async () => {
    if (!selectedDepartmentId || !selectedCategoryId || !selectedStatusId) {
      alert("Please select department, category, and status.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/tickets`,
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
          status_id: parseInt(selectedStatusId, 10),
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
              <p className="text-lg text-gray-500">T-001</p>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium">DATE REPORTED:</p>
              <p className="text-sm">01/12/2025</p>
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
                {departments?.map((dept) => (
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
              onValueChange={(value) => {
                setSelectedSubCategoryId(value);
                // Reset PC part selection when sub-category changes
                setSelectedPcPartId("");
              }}
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

          {/* Status */}
          <div>
            <Label className="block mb-2">Status *</Label>
            <Select
              value={selectedStatusId}
              onValueChange={setSelectedStatusId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select a status" />
              </SelectTrigger>
              <SelectContent>
                {statuses?.map((stat) => (
                  <SelectItem key={stat.id} value={stat.id.toString()}>
                    {stat.name}
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
              onValueChange={(value) => {
                isSettingAssetRef.current = true;
                setSelectedAssetId(value);
                // Reset PC part selection when asset changes
                setSelectedPcPartId("");
                // Automatically set the sub-category and category based on the selected asset
                const selectedAsset = assets.find(asset => asset.id?.toString() === value);
                if (selectedAsset) {
                  // Set the sub-category first
                  const subCategoryId = selectedAsset.sub_category_id?.toString();
                  setSelectedSubCategoryId(subCategoryId || "");
                  
                  // Then find and set the category based on the sub-category
                  if (subCategoryId) {
                    const assetSubCategory = subCategories.find(
                      subCat => subCat.id?.toString() === subCategoryId
                    );
                    
                    if (assetSubCategory) {
                      const categoryId = assetSubCategory.category_id?.toString();
                      setSelectedCategoryId(categoryId || "");
                    }
                  }
                }
                // Reset the ref after state updates
                setTimeout(() => {
                  isSettingAssetRef.current = false;
                }, 0);
              }}
              disabled={!selectedDepartmentId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select an asset" />
              </SelectTrigger>
              <SelectContent>
                {(isPcUnitSelected ? pcUnitFilteredAssets : filteredAssets)?.map((asset) => (
                  <SelectItem key={asset.id} value={asset.id.toString()}>
                    {asset.item_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* PC Part  */}
            <div>
              <Label className="block mb-2">PC Part</Label>
              <Select
                value={selectedPcPartId}
                onValueChange={setSelectedPcPartId}
                disabled={!selectedAssetId}
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
              {filteredPcParts.length === 0 && (
                <p className="text-sm text-gray-500 mt-1">
                  No PC parts found for this asset
                </p>
              )}
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
