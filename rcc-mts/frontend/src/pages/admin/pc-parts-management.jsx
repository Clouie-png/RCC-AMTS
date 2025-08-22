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
import { AddPCPartDialog, EditPCPartDialog } from "@/components/pc-parts-management";
import {
  FileDown,
  Search,
  Download,
  Loader2,
  Trash2,
} from "lucide-react";
import { BulkUploadDialog } from "@/components/bulk-upload";
import { exportToCSV, downloadFile } from "@/lib/csv-utils";

const API_URL = "http://localhost:3001";

export function PCPartsManagement() {
  const { user } = useAuth();

  const [pcParts, setPCParts] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [assets, setAssets] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch PC parts
  const fetchPCParts = async () => {
    if (!user?.token) return;
    setIsLoading(true);
    try {
      // Fetch PC parts and all related data
      const [pcPartsRes, deptsRes, catsRes, subCatsRes, assetsRes] = await Promise.all([
        axios.get(`${API_URL}/pc-parts`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_URL}/departments`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_URL}/categories`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_URL}/sub-categories`, {
          headers: { Authorization: `Bearer ${user.token}` },
        }),
        axios.get(`${API_URL}/assets`, {
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

      // Enhance PC parts with department names
      const enhancedPCParts = pcPartsRes.data.map(part => ({
        ...part,
        department_name: departmentMap[part.department_id]?.name || 'N/A',
      }));

      // Enhance assets with department information
      const enhancedAssets = assetsRes.data.map(asset => {
        const subCategory = subCategoryMap[asset.sub_category_id] || {};
        const category = categoryMap[subCategory.category_id] || {};
        const department = departmentMap[category.department_id] || {};
        
        return {
          ...asset,
          department_id: department.id || null,
          department_name: department.name || 'N/A',
          category_name: category.name || 'N/A',
          sub_category_name: subCategory.name || 'N/A',
        };
      });

      setPCParts(enhancedPCParts);
      setDepartments(deptsRes.data);
      setAssets(enhancedAssets);
    } catch (error) {
      console.error("Error fetching PC parts:", error);
      setPCParts([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Delete PC part
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this PC part?")) return;
    try {
      await axios.delete(`${API_URL}/pc-parts/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      fetchPCParts();
      alert("PC part deleted successfully");
    } catch (error) {
      console.error("Error deleting PC part:", error);
      alert("Failed to delete PC part.");
    }
  };

  // Function to export PC parts to CSV
  const exportPCPartsToCSV = () => {
    const data = pcParts.map(part => ({
      "Department": part.department_name,
      "Item Code": part.asset_item_code,
      "Part Name": part.part_name,
      "Date Acquired": part.date_acquired,
      "Serial No.": part.serial_no,
      "Unit Price": part.unit_price,
      "Description": part.description,
      "Supplier": part.supplier
    }));
    
    exportToCSV(data, "pc-parts-export.csv");
  };

  // Function to download CSV template
  const downloadTemplate = () => {
    const csvContent = "Department ID,Asset Item Code,Part Name,Date Acquired,Serial No.,Unit Price,Description,Supplier\n";
    downloadFile(csvContent, "pc-parts-template.csv", "text/csv;charset=utf-8;");
  };

  useEffect(() => {
    fetchPCParts();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get unique departments for filters
  const uniqueDepartments = useMemo(() => {
    return [...new Set(pcParts.map((part) => part.department_name))].filter(Boolean);
  }, [pcParts]);

  // Filter PC parts
  const filteredPCParts = useMemo(() => {
    return pcParts.filter((part) => {
      const matchesDepartment =
        departmentFilter === "all" || part.department_name === departmentFilter;
      const matchesSearch =
        !searchQuery ||
        part.asset_item_code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.part_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.serial_no.toLowerCase().includes(searchQuery.toLowerCase()) ||
        part.description.toLowerCase().includes(searchQuery.toLowerCase());

      return matchesDepartment && matchesSearch;
    });
  }, [pcParts, departmentFilter, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredPCParts.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedPCParts = filteredPCParts.slice(startIndex, endIndex);

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
          <p className="text-sm text-gray-500">Loading PC parts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center mb-4 p-4 md:p-6">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          PC Parts Management
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
          </div>

          {/* Main Content */}
          <div className="flex flex-col gap-4">
            {/* Search and Action Buttons */}
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search PC parts..."
                  className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px] dark:bg-gray-800"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex items-center gap-2">
              <AddPCPartDialog
                fetchPCParts={fetchPCParts}
                departments={departments}
                assets={assets}
              />
              <BulkUploadDialog
                fetchItems={fetchPCParts}
                entityName="PC Parts"
                templateHeaders={["Department ID", "Asset Item Code", "Part Name", "Date Acquired", "Serial No.", "Unit Price", "Description", "Supplier"]}
                requiredFields={["Department ID", "Asset Item Code", "Part Name", "Date Acquired", "Unit Price", "Description"]}
                endpoint="pc-parts"
                validationRules={{
                  "Unit Price": (value) => {
                    const num = parseFloat(value);
                    return !isNaN(num) && num >= 0 ? true : "Unit Price must be a valid non-negative number";
                  },
                  "Date Acquired": (value) => {
                    const date = new Date(value);
                    return !isNaN(date.getTime()) ? true : "Date Acquired must be a valid date";
                  },
                  "Department ID": (value) => {
                    const num = parseInt(value);
                    return !isNaN(num) && num > 0 ? true : "Department ID must be a valid positive integer";
                  }
                }}
                fieldMappings={{
                  "Department ID": "department_id",
                  "Asset Item Code": "asset_item_code",
                  "Part Name": "part_name",
                  "Date Acquired": "date_acquired",
                  "Serial No.": "serial_no",
                  "Unit Price": "unit_price",
                  "Description": "description",
                  "Supplier": "supplier"
                }}
              />
              <Button onClick={exportPCPartsToCSV}>
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
                      <TableHead>Department</TableHead>
                      <TableHead>Item Code</TableHead>
                      <TableHead>Part Name</TableHead>
                      <TableHead>Date Acquired</TableHead>
                      <TableHead>Serial No.</TableHead>
                      <TableHead>Unit Price</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Supplier</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedPCParts.length > 0 ? (
                      paginatedPCParts.map((part) => (
                        <TableRow key={part.id}>
                          <TableCell>{part.department_name}</TableCell>
                          <TableCell>{part.asset_item_code}</TableCell>
                          <TableCell>{part.part_name}</TableCell>
                          <TableCell>{part.date_acquired}</TableCell>
                          <TableCell>{part.serial_no}</TableCell>
                          <TableCell>
                            ₱{Number(part.unit_price).toLocaleString()}
                          </TableCell>
                          <TableCell>{part.description}</TableCell>
                          <TableCell>{part.supplier}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <EditPCPartDialog
                                pcPart={part}
                                fetchPCParts={fetchPCParts}
                                departments={departments}
                                assets={assets}
                              />
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDelete(part.id)}
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
                          colSpan={9}
                          className="text-center py-8 text-gray-500"
                        >
                          No PC parts found matching your criteria.
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
                  Showing {filteredPCParts.length > 0 ? startIndex + 1 : 0} -{" "}
                  {Math.min(endIndex, filteredPCParts.length)} of{" "}
                  {filteredPCParts.length} PC parts
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