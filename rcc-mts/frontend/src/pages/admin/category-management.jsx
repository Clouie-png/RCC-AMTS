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
  Upload,
  Pencil,
  Trash2,
  Download,
  Plus,
} from "lucide-react";
import { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

// // const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

// --- Dialog Components ---

const AddCategoryDialog = ({ fetchCategories, categories }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  const handleConfirm = async () => {
    if (name.trim()) {
      // Client-side check for existing category name
      const categoryExists = categories.some(
        (cat) => cat.name.toLowerCase() === name.trim().toLowerCase()
      );

      if (categoryExists) {
        alert("Category with this name already exists.");
        return;
      }

      try {
        await axios.post(
          `${API_BASE_URL}/categories`,
          { name: name.trim() },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        fetchCategories();
        setOpen(false);
        setName("");
        alert("Add Successful");
      } catch (error) {
        console.error("Error adding category:", error);
        if (error.response && error.response.status === 409) {
          alert(error.response.data.message);
        } else {
          alert("Failed to add category.");
        }
      }
    }
  };

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
          <DialogTitle>Add Category</DialogTitle>
          <DialogDescription>
            Enter the details for the new category.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Category Name
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

const EditCategoryDialog = ({ category, fetchCategories }) => {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(category.name);

  const handleConfirm = async () => {
    if (name.trim()) {
      try {
        await axios.put(
          `${API_BASE_URL}/categories/${category.id}`,
          { name: name.trim() },
          { headers: { Authorization: `Bearer ${user.token}` } }
        );
        fetchCategories();
        setOpen(false);
        alert("Edit Successful");
      } catch (error) {
        console.error("Error editing category:", error);
        alert("Failed to edit category.");
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
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Update the name for the category: {category.name}.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
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

const DeleteCategoryDialog = ({ category, fetchCategories }) => {
  const { user } = useAuth();
  const handleConfirm = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/categories/${category.id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchCategories();
      alert("Delete Successful");
    } catch (error) {
      console.error("Error deleting category:", error);
      alert("Failed to delete category.");
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
            {category.name}" category.
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

export function CategoryManagement() {
  const { user } = useAuth();
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const fetchCategories = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
    }
  };

  useEffect(() => {
    fetchCategories();
  }, [user]);

  const filteredCategories = categories.filter((cat) => {
    const matchesSearch =
      !searchQuery ||
      cat.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4 p-4 md:p-6">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          Category Management
        </h1>
      </div>
      <main className="flex flex-1 flex-col gap-4 px-4 md:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search categories..."
                className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px] dark:bg-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <AddCategoryDialog fetchCategories={fetchCategories} categories={categories} />
              <Button>
                <Upload className="mr-2 h-4 w-4" />
                BULK UPLOAD
              </Button>
              <Button>
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
                    <TableHead>CATEGORY ID</TableHead>
                    <TableHead>CATEGORY NAME</TableHead>
                    <TableHead>TICKET COUNT</TableHead>
                    <TableHead className="text-right">ACTIONS</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedCategories.map((cat) => {
                    return (
                      <TableRow key={cat.id}>
                        <TableCell>{`C-${String(cat.id).padStart(
                          3,
                          "0"
                        )}`}</TableCell>
                        <TableCell>{cat.name}</TableCell>
                        <TableCell>{cat.ticketCount}</TableCell>
                        <TableCell className="text-right">
                          <EditCategoryDialog
                            category={cat}
                            fetchCategories={fetchCategories}
                          />
                          <DeleteCategoryDialog
                            category={cat}
                            fetchCategories={fetchCategories}
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
                Showing {paginatedCategories.length > 0 ? startIndex + 1 : 0} -{" "}
                {Math.min(endIndex, filteredCategories.length)} of{" "}
                {filteredCategories.length} categories
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
              <Button>
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
