import { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function EditPCPartDialog({ pcPart, fetchPCParts, departments, assets, subCategories }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState(pcPart.department_id?.toString() || "");
  const [selectedAssetItemCode, setSelectedAssetItemCode] = useState(pcPart.asset_item_code || "");
  const [partName, setPartName] = useState(pcPart.part_name || "");
  const [dateAcquired, setDateAcquired] = useState(pcPart.date_acquired || "");
  const [serialNo, setSerialNo] = useState(pcPart.serial_no || "");
  const [unitPrice, setUnitPrice] = useState(pcPart.unit_price || "");
  const [description, setDescription] = useState(pcPart.description || "");
  const [supplier, setSupplier] = useState(pcPart.supplier || "");

  // Find the PC Unit sub-category
  const pcUnitSubCategory = useMemo(() => {
    if (!subCategories || !Array.isArray(subCategories)) return null;
    
    return subCategories.find(
      (subCat) => subCat.name && subCat.name.toLowerCase().includes("pc unit")
    );
  }, [subCategories]);

  // Filter assets by selected department and PC Unit sub-category
  const filteredAssets = useMemo(() => {
    if (!selectedDepartmentId || !pcUnitSubCategory) return [];
    return assets.filter(asset => 
      asset.department_id === parseInt(selectedDepartmentId) &&
      asset.sub_category_id === pcUnitSubCategory.id
    );
  }, [assets, selectedDepartmentId, pcUnitSubCategory]);

  useEffect(() => {
    if (open) {
      setSelectedDepartmentId(pcPart.department_id?.toString() || "");
      setSelectedAssetItemCode(pcPart.asset_item_code || "");
      setPartName(pcPart.part_name || "");
      setDateAcquired(pcPart.date_acquired || "");
      setSerialNo(pcPart.serial_no || "");
      setUnitPrice(pcPart.unit_price || "");
      setDescription(pcPart.description || "");
      setSupplier(pcPart.supplier || "");
    }
  }, [open, pcPart]);

  const handleUpdate = async () => {
    if (
      !selectedDepartmentId ||
      !selectedAssetItemCode ||
      !partName.trim() ||
      !dateAcquired ||
      !serialNo.trim() ||
      !unitPrice ||
      !description.trim() ||
      !supplier.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await axios.put(
        `${API_BASE_URL}/pc-parts/${pcPart.id}`,
        {
          department_id: parseInt(selectedDepartmentId),
          asset_item_code: selectedAssetItemCode,
          part_name: partName.trim(),
          date_acquired: dateAcquired,
          serial_no: serialNo.trim(),
          unit_price: parseFloat(unitPrice),
          description: description.trim(),
          supplier: supplier.trim(),
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      fetchPCParts();
      setOpen(false);
      alert("PC Part updated successfully");
    } catch (error) {
      console.error("Error updating PC part:", error);
      alert("Failed to update PC part.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4 text-blue-600" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit PC Part</DialogTitle>
          <DialogDescription>
            Update the details for this PC part.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="department">Department</Label>
            <Select 
              onValueChange={setSelectedDepartmentId} 
              value={selectedDepartmentId}
            >
              <SelectTrigger id="department">
                <SelectValue placeholder="Select department" />
              </SelectTrigger>
              <SelectContent>
                {departments
                  .filter((dept) => dept.status === "Active")
                  .map((dept) => (
                    <SelectItem key={dept.id} value={dept.id.toString()}>
                      {dept.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemCode">Item Code</Label>
            <Select 
              onValueChange={setSelectedAssetItemCode} 
              value={selectedAssetItemCode}
              disabled={!selectedDepartmentId}
            >
              <SelectTrigger id="itemCode">
                <SelectValue placeholder="Select item code" />
              </SelectTrigger>
              <SelectContent>
                {filteredAssets && filteredAssets.length > 0 ? (
                  filteredAssets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.item_code}>
                      {asset.item_code}
                    </SelectItem>
                  ))
                ) : (
                  <SelectItem value="no-assets" disabled>
                    No PC Unit assets available for this department
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editPartName">Part Name</Label>
            <Input
              id="editPartName"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="Enter part name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editDateAcquired">Date Acquired</Label>
            <Input
              id="editDateAcquired"
              type="date"
              value={dateAcquired}
              onChange={(e) => setDateAcquired(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editSerialNo">Serial No.</Label>
            <Input
              id="editSerialNo"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="Enter serial number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editUnitPrice">Unit Price (PHP)</Label>
            <Input
              id="editUnitPrice"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editSupplier">Supplier</Label>
            <Input
              id="editSupplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="editDescription">Description</Label>
            <textarea
              id="editDescription"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full min-h-[100px] p-2 border border-gray-300 rounded-md"
              placeholder="Enter part description"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleUpdate}>Update PC Part</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}