import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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
import { Calendar } from "@/components/ui/calendar";
import { Plus } from "lucide-react";
import { format } from "date-fns";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";

const API_URL = "http://localhost:3001";

export function AddAssetDialog({
  fetchAssets,
  departments,
  categories,
  subCategories,
}) {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [itemCode, setItemCode] = useState("");
  const [dateAcquired, setDateAcquired] = useState(null);
  const [serialNo, setSerialNo] = useState("");
  const [unitPrice, setUnitPrice] = useState("");
  const [description, setDescription] = useState("");
  const [supplier, setSupplier] = useState("");
  const [selectedDepartmentId, setSelectedDepartmentId] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("");

  const filteredCategories = categories.filter(
    (cat) => cat.department_id.toString() === selectedDepartmentId
  );

  const filteredSubCategories = subCategories.filter(
    (subCat) => subCat.category_id.toString() === selectedCategoryId
  );

  useEffect(() => {
    setSelectedCategoryId("");
    setSelectedSubCategoryId("");
  }, [selectedDepartmentId]);

  useEffect(() => {
    setSelectedSubCategoryId("");
  }, [selectedCategoryId]);

  const handleConfirm = async () => {
    if (
      itemCode.trim() &&
      dateAcquired &&
      serialNo.trim() &&
      unitPrice &&
      description.trim() &&
      supplier.trim() &&
      selectedSubCategoryId
    ) {
      try {
        await axios.post(
          `${API_URL}/assets`,
          {
            item_code: itemCode.trim(),
            date_acquired:
              dateAcquired instanceof Date
                ? format(dateAcquired, "yyyy-MM-dd")
                : dateAcquired,
            serial_no: serialNo.trim(),
            unit_price: parseFloat(unitPrice),
            description: description.trim(),
            supplier: supplier.trim(),
            sub_category_id: parseInt(selectedSubCategoryId),
          },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        fetchAssets();
        setOpen(false);
        setItemCode("");
        setDateAcquired(null);
        setSerialNo("");
        setUnitPrice("");
        setDescription("");
        setSupplier("");
        setSelectedDepartmentId("");
        setSelectedCategoryId("");
        setSelectedSubCategoryId("");
        alert("Add Successful");
      } catch (error) {
        console.error("Error adding asset:", error);
        alert("Failed to add asset.");
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          ADD ASSET
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Asset</DialogTitle>
          <DialogDescription>
            Enter the details for the new asset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Classification Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Classification</h3>
              <p className="text-sm text-gray-500">Categorize this asset</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="department">Department</Label>
                <Select 
                  value={selectedDepartmentId} 
                  onValueChange={setSelectedDepartmentId}
                  disabled={!departments.length}
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
                <Label htmlFor="category">Category</Label>
                <Select
                  value={selectedCategoryId}
                  onValueChange={setSelectedCategoryId}
                  disabled={!selectedDepartmentId || !filteredCategories.length}
                >
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id.toString()}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="subcategory">Sub-Category</Label>
                <Select
                  value={selectedSubCategoryId}
                  onValueChange={setSelectedSubCategoryId}
                  disabled={!selectedCategoryId || !filteredSubCategories.length}
                >
                  <SelectTrigger id="subcategory">
                    <SelectValue placeholder="Select sub-category" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredSubCategories.map((subCat) => (
                      <SelectItem key={subCat.id} value={subCat.id.toString()}>
                        {subCat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Asset Details Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Asset Details</h3>
              <p className="text-sm text-gray-500">Basic information about the asset</p>
            </div>
            
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code</Label>
                <Input
                  id="itemCode"
                  value={itemCode}
                  onChange={(e) => setItemCode(e.target.value)}
                  placeholder="Enter item code"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="dateAcquired">Date Acquired</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full justify-start text-left font-normal"
                      id="dateAcquired"
                    >
                      {dateAcquired ? format(dateAcquired, "PPP") : "Pick a date"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="p-0" align="start">
                    <Calendar 
                      mode="single" 
                      selected={dateAcquired} 
                      onSelect={setDateAcquired}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
              
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={supplier}
                  onChange={(e) => setSupplier(e.target.value)}
                  placeholder="Enter supplier name"
                />
              </div>
            </div>
          </div>

          <Separator />

          {/* Description Section */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold">Description</h3>
              <p className="text-sm text-gray-500">Additional details about the asset</p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full min-h-[120px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter asset description"
                maxLength={255}
              />
              <div className="text-sm text-gray-500 flex justify-between">
                <span>Describe the asset in detail</span>
                <span>{description.length}/255 characters</span>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" className="mr-2"onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleConfirm}>Add Asset</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
