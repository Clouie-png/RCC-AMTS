import { useState, useMemo } from "react";
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
import { Plus } from "lucide-react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function AddPCPartDialog({ fetchPCParts, departments, assets, subCategories }) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedAssetItemCode, setSelectedAssetItemCode] = useState("");
  const [partName, setPartName] = useState("");
  const [dateAcquiredValue, setDateAcquiredValue] = useState("");
  const [serialNo, setSerialNo] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");

  const resetForm = () => {
    setSelectedDepartmentId("");
    setSelectedAssetItemCode("");
    setPartName("");
    setDateAcquiredValue("");
    setSerialNo("");
    setUnitPrice("");
    setDescription("");
    setSupplier("");
  };

  const handleConfirm = async () => {
    if (
      !selectedDepartmentId ||
      !selectedAssetItemCode ||
      !partName.trim() ||
      !dateAcquiredValue ||
      !serialNo.trim() ||
      !unitPrice ||
      !description.trim() ||
      !supplier.trim()
    ) {
      alert("Please fill in all fields.");
      return;
    }

    try {
      await axios.post(
        `${API_BASE_URL}/pc-parts`,
        {
          department_id: parseInt(selectedDepartmentId),
          asset_item_code: selectedAssetItemCode,
          part_name: partName.trim(),
          date_acquired: dateAcquiredValue,
          serial_no: serialNo.trim(),
          unit_price: parseFloat(unitPrice),
          description: description.trim(),
          supplier: supplier.trim(),
        },
        { headers: { Authorization: `Bearer ${user.token}` } }
      );
      
      fetchPCParts();
      setOpen(false);
      resetForm();
      alert("PC Part added successfully");
    } catch (error) {
      console.error("Error adding PC part:", error);
      alert("Failed to add PC part.");
    }
  };

  // Find the PC Unit sub-category
  const pcUnitSubCategory = useMemo(() => {
    if (!subCategories || !Array.isArray(subCategories)) return null;
    
    return subCategories.find(
      (subCat) => subCat.name && subCat.name.toLowerCase().includes("pc unit")
    );
  }, [subCategories]);

  // Filter assets by selected department and PC Unit sub-category
  const filteredAssets = useMemo(() => {
    if (!selectedDepartmentId || !assets || !Array.isArray(assets) || !pcUnitSubCategory) return [];
    
    const departmentId = parseInt(selectedDepartmentId);
    
    return assets.filter(asset => {
      // Filter assets that belong to the selected department and have PC Unit sub-category
      return asset.department_id && 
             parseInt(asset.department_id) === departmentId && 
             parseInt(asset.sub_category_id) === pcUnitSubCategory.id;
    });
  }, [assets, selectedDepartmentId, pcUnitSubCategory]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          ADD PC PART
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add PC Part</DialogTitle>
          <DialogDescription>
            Enter the details for the new PC part.
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
              disabled={!selectedDepartmentId || !pcUnitSubCategory}
            >
              <SelectTrigger id="itemCode">
                <SelectValue placeholder="Select item code" />
              </SelectTrigger>
              <SelectContent>
                {!pcUnitSubCategory ? (
                  <SelectItem value="no-pc-unit" disabled>
                    No PC Unit sub-category found
                  </SelectItem>
                ) : filteredAssets && filteredAssets.length > 0 ? (
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
            <Label htmlFor="partName">Part Name</Label>
            <Input
              id="partName"
              value={partName}
              onChange={(e) => setPartName(e.target.value)}
              placeholder="Enter part name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="dateAcquired">Date Acquired</Label>
            <Input
              id="dateAcquired"
              type="date"
              value={dateAcquiredValue}
              onChange={(e) => setDateAcquiredValue(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="serialNo">Serial No.</Label>
            <Input
              id="serialNo"
              value={serialNo}
              onChange={(e) => setSerialNo(e.target.value)}
              placeholder="Enter serial number"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="unitPrice">Unit Price (PHP)</Label>
            <Input
              id="unitPrice"
              type="number"
              value={unitPrice}
              onChange={(e) => setUnitPrice(e.target.value)}
              placeholder="0.00"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="supplier">Supplier</Label>
            <Input
              id="supplier"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Enter supplier name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
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
          <Button onClick={handleConfirm}>Add PC Part</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}