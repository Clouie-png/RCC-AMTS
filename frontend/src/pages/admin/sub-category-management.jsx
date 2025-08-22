import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
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
  FileDown,
  Search,
  Pencil,
  Trash2,
  Download,
  Plus,
} from "lucide-react";
import { BulkUploadDialog } from "@/components/bulk-upload";

import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { exportToCSV, downloadFile } from "@/lib/csv-utils";

const API_URL = "http://localhost:3001";

// --- Dialog Components ---

const AddSubCategoryDialog = ({
  fetchSubCategories,
  categories,
  departments,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [selectedCategoryId, setSelectedCategoryId] = useState("");

  const handleConfirm = async () => {
    if (name.trim() && selectedCategoryId) {
      try {
        await axios.post(
          `${API_URL}/sub-categories`,
          { name: name.trim(), category_id: parseInt(selectedCategoryId) },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        fetchSubCategories();
        setOpen(false);
        setName("");
        alert("Add Successful");
      } catch (error) {
        console.error("Error adding sub-category:", error);
        alert("Failed to add sub-category.");
      }
    }
  };

  const activeCategories = categories.filter((cat) => {
    const department = departments.find(
      (dept) => dept.id === cat.department_id
    );
    return department && department.status === "Active";
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          ADD
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Sub-Category</DialogTitle>
          <DialogDescription>
            Enter the details for the new sub-category.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              onValueChange={setSelectedCategoryId}
              value={selectedCategoryId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {activeCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Sub-Category Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
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
};

const EditSubCategoryDialog = ({
  subCategory,
  fetchSubCategories,
  categories,
  departments,
}) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(subCategory.name);
  const [selectedCategoryId, setSelectedCategoryId] = useState(
    subCategory.category_id.toString()
  );

  const handleConfirm = async () => {
    if (name.trim() && selectedCategoryId) {
      try {
        await axios.put(
          `${API_URL}/sub-categories/${subCategory.id}`,
          { name: name.trim(), category_id: parseInt(selectedCategoryId) },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        fetchSubCategories();
        setOpen(false);
        alert("Edit Successful");
      } catch (error) {
        console.error("Error editing sub-category:", error);
        alert("Failed to edit sub-category.");
      }
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
          <DialogTitle>Edit Sub-Category</DialogTitle>
          <DialogDescription>
            Update the name for the sub-category: {subCategory.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Category
            </Label>
            <Select
              onValueChange={setSelectedCategoryId}
              value={selectedCategoryId}
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => {
                  const department = departments.find(
                    (dept) => dept.id === cat.department_id
                  );
                  const isInactive =
                    department && department.status === "Inactive";
                  return (
                    <SelectItem
                      key={cat.id}
                      value={cat.id.toString()}
                      disabled={isInactive}
                    >
                      {cat.name}
                      {isInactive ? " (Inactive)" : ""}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              New Name
            </Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="col-span-3"
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
};

const DeleteSubCategoryDialog = ({ subCategory, fetchSubCategories }) => {
  const { user } = useAuth();
  const handleConfirm = async () => {
    try {
      await axios.delete(`${API_URL}/sub-categories/${subCategory.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchSubCategories();
      alert("Delete Successful");
    } catch (error) {
      console.error("Error deleting sub-category:", error);
      alert("Failed to delete sub-category.");
    }
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="ghost" size="icon">
          <Trash2 className="h-4 w-4 text-blue-600" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone. This will permanently delete the "
            {subCategory.name}" sub-category.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={handleConfirm}>Confirm</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
};

// --- Main Component ---

export function SubCategoryManagement() {
  const { user } = useAuth();
  const [subCategories, setSubCategories] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchSubCategories = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_URL}/sub-categories`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setSubCategories(response.data);
    } catch (error) {
      console.error("Error fetching sub-categories:", error);
    }
  };

  const fetchCategories = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_URL}/categories`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  const fetchDepartments = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_URL}/departments`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  // Function to export sub-categories to CSV
  const exportSubCategoriesToCSV = () => {
    const data = subCategories.map(subCat => {
      const category = categories.find(cat => cat.id === subCat.category_id);
      return {
        "Sub-Category ID": `SC-${String(subCat.id).padStart(3, "0")}`,
        "Sub-Category Name": subCat.name,
        "Category": category ? category.name : "N/A",
        "Ticket Count": subCat.ticketCount
      };
    });
    
    exportToCSV(data, "sub-categories-export.csv");
  };

  // Function to download CSV template
  const downloadTemplate = () => {
    const csvContent = "Sub-Category Name,Category ID\n";
    downloadFile(csvContent, "sub-categories-template.csv", "text/csv;charset=utf-8;");
  };

  useEffect(() => {
    fetchSubCategories();
    fetchCategories();
    fetchDepartments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredSubCategories = subCategories.filter((subCat) => {
    const matchesSearch =
      !searchQuery ||
      subCat.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredSubCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedSubCategories = filteredSubCategories.slice(
    startIndex,
    endIndex
  );

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4 p-4 md:p-6">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          Sub-Category Management
        </h1>
      </div>
      <main className="flex flex-1 flex-col gap-4 px-4 md:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search sub-categories..."
                className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px] dark:bg-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <AddSubCategoryDialog
                fetchSubCategories={fetchSubCategories}
                categories={categories}
                departments={departments}
              />
              <BulkUploadDialog
                fetchItems={fetchSubCategories}
                entityName="Sub-Categories"
                templateHeaders={["Sub-Category Name", "Category ID"]}
                requiredFields={["Sub-Category Name", "Category ID"]}
                endpoint="sub-categories"
                validationRules={{
                  "Category ID": (value) => {
                    const num = parseInt(value);
                    return !isNaN(num) && num > 0 ? true : "Category ID must be a valid positive integer";
                  }
                }}
                fieldMappings={{
                  "Sub-Category Name": "name",
                  "Category ID": "category_id"
                }}
              />
              <Button onClick={exportSubCategoriesToCSV}>
                <FileDown className="mr-2 h-4 w-4" />
                EXPORT
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="h-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>SUB-CATEGORY ID</TableHead>
                    <TableHead>SUB-CATEGORY NAME</TableHead>
                    <TableHead>CATEGORY NAME</TableHead>
                    <TableHead>TICKET COUNT</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedSubCategories.map((subCat) => {
                    const category = categories.find(
                      (cat) => cat.id === subCat.category_id
                    );
                    return (
                      <TableRow key={subCat.id}>
                        <TableCell>{`SC-${String(subCat.id).padStart(
                          3,
                          "0"
                        )}`}</TableCell>
                        <TableCell>{subCat.name}</TableCell>
                        <TableCell>
                          {category ? category.name : "N/A"}
                        </TableCell>
                        <TableCell>{subCat.ticketCount}</TableCell>
                        <TableCell className="text-right">
                          <EditSubCategoryDialog
                            subCategory={subCat}
                            fetchSubCategories={fetchSubCategories}
                            categories={categories}
                            departments={departments}
                          />
                          <DeleteSubCategoryDialog
                            subCategory={subCat}
                            fetchSubCategories={fetchSubCategories}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
                  setCurrentPage(1);
                }}
                defaultValue={String(itemsPerPage)}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue placeholder="Rows per page" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-sm text-gray-500">
                Showing {paginatedSubCategories.length > 0 ? startIndex + 1 : 0}{" "}
                - {Math.min(endIndex, filteredSubCategories.length)} of{" "}
                {filteredSubCategories.length} sub-categories
              </span>
            </div>
            <div className="flex items-center gap-4">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={() =>
                        setCurrentPage((prev) => Math.max(1, prev - 1))
                      }
                      className={
                        currentPage === 1
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                  {[...Array(totalPages)].map((_, index) => (
                    <PaginationItem key={index}>
                      <PaginationLink
                        href="#"
                        isActive={currentPage === index + 1}
                        onClick={() => setCurrentPage(index + 1)}
                      >
                        {index + 1}
                      </PaginationLink>
                    </PaginationItem>
                  ))}
                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={() =>
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1))
                      }
                      className={
                        currentPage === totalPages
                          ? "pointer-events-none opacity-50"
                          : ""
                      }
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
              <Button onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                DOWNLOAD TEMPLATE
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
