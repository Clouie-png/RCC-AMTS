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
import {
  FileDown,
  Search,
  Download,
  Loader2,
} from "lucide-react";
import { BulkUploadDialog } from "@/components/bulk-upload";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import {
  AddDepartmentDialog,
  DeleteDepartmentDialog,
  EditDepartmentDialog,
  exportDepartmentsToCSV,
  exportToCSV,
} from "@/components/department-management";
import { downloadFile } from "@/lib/csv-utils";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [locationFilter, setLocationFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchDepartments = async () => {
    if (!user) return;
    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/departments`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Get unique locations dynamically
  const uniqueLocations = useMemo(() => {
    return [...new Set(departments.map((dept) => dept.location))];
  }, [departments]);

  // Filter departments with search functionality
  const filteredDepartments = useMemo(() => {
    return departments.filter((dept) => {
      const matchesStatus =
        statusFilter === "all" || dept.status === statusFilter;
      const matchesLocation =
        locationFilter === "all" || dept.location === locationFilter;
      const matchesSearch =
        !searchQuery ||
        dept.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.head.toLowerCase().includes(searchQuery.toLowerCase()) ||
        dept.id.toString().toLowerCase().includes(searchQuery.toLowerCase());

      return matchesStatus && matchesLocation && matchesSearch;
    });
  }, [departments, statusFilter, locationFilter, searchQuery]);

  // Pagination logic
  const totalPages = Math.ceil(filteredDepartments.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedDepartments = filteredDepartments.slice(startIndex, endIndex);

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

  // Function to download CSV template
  const downloadTemplate = () => {
    const csvContent = "Name,Location,Head,Status\n";
    downloadFile(csvContent, "departments-template.csv", "text/csv;charset=utf-8;");
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-500">Loading departments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center mb-4 p-4 md:p-6">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Department Management
        </h1>
      </div>

      <main className="flex flex-1 flex-col gap-4 px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-[200px_1fr] lg:grid-cols-[250px_1fr]">
          {/* Filters Sidebar */}
          <div className="flex flex-col gap-4">
            <div>
              <h2 className="mb-2 font-semibold">Filter by Status</h2>
              <Select
                onValueChange={handleFilterChange(setStatusFilter)}
                defaultValue="all"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <h2 className="mb-2 font-semibold">Filter by Location</h2>
              <Select
                onValueChange={handleFilterChange(setLocationFilter)}
                defaultValue="all"
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {uniqueLocations.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
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
                  placeholder="Search departments..."
                  className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px] dark:bg-gray-800"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <AddDepartmentDialog
                  fetchDepartments={fetchDepartments}
                  departments={departments}
                />
                <BulkUploadDialog
                  fetchItems={fetchDepartments}
                  entityName="Departments"
                  templateHeaders={["Name", "Location", "Head", "Status"]}
                  requiredFields={["Name", "Location", "Head", "Status"]}
                  endpoint="departments"
                  validationRules={{
                    "Status": (value) => {
                      return ["Active", "Inactive"].includes(value) ? true : "Status must be either 'Active' or 'Inactive'";
                    }
                  }}
                  fieldMappings={{
                    "Name": "name",
                    "Location": "location",
                    "Head": "head",
                    "Status": "status"
                  }}
                />
                <Button onClick={() => exportDepartmentsToCSV(departments, exportToCSV)}>
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
                      <TableHead>DEPT. ID</TableHead>
                      <TableHead>DEPT. NAME</TableHead>
                      <TableHead>LOCATION</TableHead>
                      <TableHead>HEAD</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedDepartments.length > 0 ? (
                      paginatedDepartments.map((dept) => (
                        <TableRow key={dept.id}>
                          <TableCell className="font-medium">
                            {`D-${String(dept.id).padStart(3, "0")}`}
                          </TableCell>
                          <TableCell>{dept.name}</TableCell>
                          <TableCell>{dept.location}</TableCell>
                          <TableCell>{dept.head}</TableCell>
                          <TableCell>
                            <span
                              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                dept.status === "Active"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-red-100 text-red-800"
                              }`}
                            >
                              {dept.status}
                            </span>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <EditDepartmentDialog
                                department={dept}
                                fetchDepartments={fetchDepartments}
                              />
                              <DeleteDepartmentDialog
                                department={dept}
                                fetchDepartments={fetchDepartments}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={6}
                          className="text-center py-8 text-gray-500"
                        >
                          No departments found matching your criteria.
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
                  Showing {filteredDepartments.length > 0 ? startIndex + 1 : 0}{" "}
                  - {Math.min(endIndex, filteredDepartments.length)} of{" "}
                  {filteredDepartments.length} departments
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