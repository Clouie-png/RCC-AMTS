import { useState, useEffect, useMemo } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
import { useAuth } from "@/context/AuthContext";
import { AddAssetDialog } from "@/components/asset-management";
import { EditAssetDialog } from "@/components/asset-management";
import { BulkUploadDialog } from "@/components/bulk-upload";
import { DescriptionModal } from "@/components/ui/description-modal";
import {
  FileDown,
  Search,
  Download,
  Loader2,
  Trash2,
} from "lucide-react";
import { exportToCSV, downloadFile } from "@/lib/csv-utils";

// // const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function AssetManagement() {
  const { user } = useAuth();

  const [assets, setAssets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch assets
  const fetchAssets = async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      // Fetch assets and all related data
      const [assetsRes, deptsRes, catsRes, subCatsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/assets`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_BASE_URL}/departments`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_BASE_URL}/categories`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_BASE_URL}/sub-categories`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);

      // Create maps for quick lookup
      const departmentMap = deptsRes.data.reduce((acc, dept) => {
        acc[dept.id] = dept;
        return acc;
      }, {});

      const categoryMap = catsRes.data.reduce((acc, cat) => {
        acc[cat.id] = cat;
        return acc;
      }, {});

      const subCategoryMap = subCatsRes.data.reduce((acc, subCat) => {
        acc[subCat.id] = subCat;
        return acc;
      }, {});

      // Enhance assets with names (department information is now directly on assets)
      const enhancedAssets = assetsRes.data.map((asset) => {
        const subCategory = subCategoryMap[asset.sub_category_id] || {};
        const category = categoryMap[subCategory.category_id] || {};
        const department = departmentMap[asset.department_id] || {};

        return {
          ...asset,
          department_name: department.name || "N/A",
          category_name: category.name || "N/A",
          sub_category_name: subCategory.name || "N/A",
        };
      });

      setAssets(enhancedAssets);
    } catch (error) {
      console.error("Error fetching assets:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch dropdown data
  const fetchDropdownData = async () => {
    if (!user?.token) return;
    try {
      const [deptRes, catRes, subCatRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/departments`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_BASE_URL}/categories`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_BASE_URL}/sub-categories`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
      ]);
      setDepartments(deptRes.data);
      setCategories(catRes.data);
      setSubCategories(subCatRes.data);
    } catch (error) {
      console.error("Error fetching dropdown data:", error);
    }
  };

  // Function to export assets to CSV
  const exportAssetsToCSV = () => {
    const data = assets.map(asset => ({
      "Item Code": asset.item_code,
      "Date Acquired": asset.date_acquired,
      "Serial No.": asset.serial_no,
      "Unit Price": asset.unit_price,
      "Description": asset.description,
      "Supplier": asset.supplier,
      "Department": asset.department_name,
      "Category": asset.category_name,
      "Sub-Category": asset.sub_category_name
    }));
    
    exportToCSV(data, "assets-export.csv");
  };

  // Function to download CSV template
  const downloadTemplate = () => {
    const csvContent = "Item Code,Date Acquired,Serial No.,Unit Price,Description,Supplier,Sub-Category ID\n";
    downloadFile(csvContent, "assets-template.csv", "text/csv;charset=utf-8;");
  };

  // Delete asset
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this asset?")) return;
    try {
      await axios.delete(`${API_BASE_URL}/assets/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchAssets();
      alert("Asset deleted successfully");
    } catch (error) {
      console.error("Error deleting asset:", error);
      alert("Failed to delete asset.");
    }
  };

  useEffect(() => {
    fetchAssets();
    fetchDropdownData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get unique departments and categories for filters
  const uniqueDepartments = useMemo(() => {
    return [...new Set(assets.map((asset) => asset.department_name))].filter(
      Boolean
    );
  }, [assets]);

  const uniqueCategories = useMemo(() => {
    return [...new Set(assets.map((asset) => asset.category_name))].filter(
      Boolean
    );
  }, [assets]);

  // Filter assets
  const filteredAssets = useMemo(() => {
    return assets.filter((asset) => {
      const matchesDepartment =
        departmentFilter === "all" ||
        asset.department_name === departmentFilter;
      const matchesCategory =
        categoryFilter === "all" || asset.category_name === categoryFilter;
      const matchesSearch =
        !searchQuery ||
        asset.item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.serial_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        asset.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDepartment && matchesCategory && matchesSearch;
    });
  }, [assets, departmentFilter, categoryFilter, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredAssets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedAssets = filteredAssets.slice(startIndex, endIndex);

  // Reset page when filters change
  const handleFilterChange = (filterSetter) => (value) => {
    filterSetter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setCurrentPage(1);
  };

  const handleItemsPerPageChange = (value) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-500">Loading assets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center mb-4 p-4 md:p-6">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Asset Management
        </h1>
      </div>

      <main className="flex flex-1 flex-col gap-4 px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
          {/* Filters Sidebar */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-2 font-semibold">Filter by Department</h2>
              <Select
                onValueChange={handleFilterChange(setDepartmentFilter)}
                defaultValue="all"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {uniqueDepartments.map((dept) => (
                    <SelectItem key={dept} value={dept}>
                      {dept}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <h2 className="mb-2 font-semibold">Filter by Category</h2>
              <Select
                onValueChange={handleFilterChange(setCategoryFilter)}
                defaultValue="all"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {uniqueCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-4">
            {/* Search and Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search assets..."
                  className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px] dark:bg-gray-800"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <AddAssetDialog
                  fetchAssets={fetchAssets}
                  departments={departments}
                  categories={categories}
                  subCategories={subCategories}
                  assets={assets}
                />
                <BulkUploadDialog
                  fetchItems={fetchAssets}
                  entityName="Assets"
                  templateHeaders={["Item Code", "Date Acquired", "Serial No.", "Unit Price", "Description", "Supplier", "Sub-Category ID"]}
                  requiredFields={["Item Code", "Date Acquired", "Unit Price", "Description", "Sub-Category ID"]}
                  endpoint="assets"
                  validationRules={{
                    "Unit Price": (value) => {
                      const num = parseFloat(value);
                      return !isNaN(num) && num >= 0 ? true : "Unit Price must be a valid non-negative number";
                    },
                    "Date Acquired": (value) => {
                      const date = new Date(value);
                      return !isNaN(date.getTime()) ? true : "Date Acquired must be a valid date";
                    }
                  }}
                  fieldMappings={{
                    "Item Code": "item_code",
                    "Date Acquired": "date_acquired",
                    "Serial No.": "serial_no",
                    "Unit Price": "unit_price",
                    "Description": "description",
                    "Supplier": "supplier",
                    "Sub-Category ID": "sub_category_id"
                  }}
                />
                <Button onClick={exportAssetsToCSV}>
                  <FileDown className="mr-2 h-4 w-4" />
                  EXPORT
                </Button>
              </div>
            </div>

            {/* Data Table */}
            <Card>
              <CardContent className="h-full">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Date Acquired</TableHead>
                      <TableHead>Serial No.</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Sub-Category</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedAssets.length > 0 ? (
                      paginatedAssets.map((asset) => (
                        <TableRow key={asset.id}>
                          <TableCell>{asset.item_code}</TableCell>
                          <TableCell>{asset.date_acquired}</TableCell>
                          <TableCell>{asset.serial_no}</TableCell>
                          <TableCell>
                            ₱{Number(asset.unit_price).toLocaleString()}
                          </TableCell>
                          <TableCell className="align-top">
                            <DescriptionModal text={asset.description} maxLength={20} />
                          </TableCell>
                          <TableCell>{asset.supplier}</TableCell>
                          <TableCell>{asset.department_name}</TableCell>
                          <TableCell>{asset.category_name}</TableCell>
                          <TableCell>{asset.sub_category_name}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <EditAssetDialog
                                asset={asset}
                                fetchAssets={fetchAssets}
                                departments={departments}
                                categories={categories}
                                subCategories={subCategories}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(asset.id)}
                              >
                                <Trash2 className="h-4 w-4 text-blue-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={10}
                          className="text-center py-8 text-gray-500"
                        >
                          No assets found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Pagination and Controls */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Select
                  onValueChange={handleItemsPerPageChange}
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
                  Showing {filteredAssets.length > 0 ? startIndex + 1 : 0} -{" "}
                  {Math.min(endIndex, filteredAssets.length)} of{" "}
                  {filteredAssets.length} assets
                </span>
              </div>

              <div className="flex items-center gap-4">
                {totalPages > 0 && (
                  <Pagination>
                    <PaginationContent>
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((prev) => Math.max(1, prev - 1));
                          }}
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
                            onClick={(e) => {
                              e.preventDefault();
                              setCurrentPage(index + 1);
                            }}
                          >
                            {index + 1}
                          </PaginationLink>
                        </PaginationItem>
                      ))}
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage((prev) =>
                              Math.min(totalPages, prev + 1)
                            );
                          }}
                          className={
                            currentPage === totalPages
                              ? "pointer-events-none opacity-50"
                              : ""
                          }
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                )}
                <Button onClick={downloadTemplate}>
                  <Download className="mr-2 h-4 w-4" />
                  DOWNLOAD TEMPLATE
                </Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
