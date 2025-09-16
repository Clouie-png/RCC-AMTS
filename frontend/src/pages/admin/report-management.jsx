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
import { FileDown, Search, Loader2, Eye } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { exportToCSV } from "@/lib/csv-utils";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ViewTicketDialog } from "@/components/ticket-management";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function ReportManagement() {
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [assets, setAssets] = useState([]);
  const [technicians, setTechnicians] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");
  const [assetFilter, setAssetFilter] = useState("all");
  const [technicianFilter, setTechnicianFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const [viewTicketDialogOpen, setViewTicketDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const { user } = useAuth();

  const handleViewTicket = (ticket) => {
    setSelectedTicketId(ticket.id);
    setViewTicketDialogOpen(true);
  };

  const fetchTickets = async () => {
    if (!user?.token) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tickets`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setTickets(response.data);
    } catch (error) {
      console.error("Error fetching tickets:", error);
      alert(`Error fetching tickets: ${error.response?.data?.message || error.message}`);
      setTickets([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!user?.token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/departments`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      alert(`Error fetching departments: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchCategories = async () => {
    if (!user?.token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/categories`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setCategories(response.data);
    } catch (error) {
      console.error("Error fetching categories:", error);
      alert(`Error fetching categories: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchSubCategories = async () => {
    if (!user?.token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/sub-categories`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setSubCategories(response.data);
    } catch (error) {
      console.error("Error fetching sub-categories:", error);
      alert(`Error fetching sub-categories: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchAssets = async () => {
    if (!user?.token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/assets`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setAssets(response.data);
    } catch (error) {
      console.error("Error fetching assets:", error);
      alert(`Error fetching assets: ${error.response?.data?.message || error.message}`);
    }
  };

  const fetchTechnicians = async () => {
    if (!user?.token) return;
    try {
      const response = await axios.get(`${API_BASE_URL}/users`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      // Filter users who can be technicians (admin or maintenance)
      const techUsers = response.data.filter(u => u.role === 'admin' || u.role === 'maintenance');
      setTechnicians(techUsers);
    } catch (error) {
      console.error("Error fetching technicians:", error);
      alert(`Error fetching technicians: ${error.response?.data?.message || error.message}`);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter((ticket) => {
      const matchesDepartment =
        departmentFilter === "all" || ticket.department_name === departmentFilter;
      const matchesCategory =
        categoryFilter === "all" || ticket.category_name === categoryFilter;
      const matchesSubCategory =
        subCategoryFilter === "all" || ticket.subcategory_name === subCategoryFilter;
      const matchesAsset =
        assetFilter === "all" || ticket.asset_item_code === assetFilter;
      const matchesTechnician =
        technicianFilter === "all" || ticket.technician_name === technicianFilter;
      const matchesDate =
        !dateFilter || (ticket.created_at && ticket.created_at.startsWith(dateFilter));
      const matchesSearch =
        !searchQuery ||
        ticket.id.toString().includes(searchQuery) ||
        ticket.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.status?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.technician_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesDepartment && matchesCategory && matchesSubCategory && matchesAsset && matchesTechnician && matchesDate && matchesSearch;
    });
  }, [tickets, departmentFilter, categoryFilter, subCategoryFilter, assetFilter, technicianFilter, dateFilter, searchQuery]);

  // Export filtered tickets to CSV
  const exportTickets = useCallback(async () => {
    if (!user?.token) return;

    try {
      if (filteredTickets.length === 0) {
        alert("No tickets to export.");
        return;
      }
      
      // Format data for export
      const data = filteredTickets.map(ticket => ({
        "Ticket ID": `000-000-000-${String(ticket.id).padStart(3, "0")}`,
        "Department": ticket.department_name || "N/A",
        "Category": ticket.category_name || "N/A",
        "Sub-Category": ticket.subcategory_name || "N/A",
        "User": ticket.user_name || "N/A",
        "Asset": ticket.asset_item_code || "N/A",
        "PC Part": ticket.pc_part_name || "N/A",
        "Description": ticket.description || "N/A",
        "Resolution": ticket.resolution || "N/A",
        "Status": ticket.status || "N/A",
        "Technician": ticket.technician_name || "Unassigned",
        "Created At": ticket.created_at || "N/A",
        "Updated At": ticket.updated_at || "N/A"
      }));
      
      // Export to CSV
      exportToCSV(data, `tickets-report-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`);
      
      alert("Tickets exported successfully!");
    } catch (error) {
      console.error("Error exporting tickets:", error);
      alert(`Error exporting tickets: ${error.response?.data?.message || error.message}`);
    }
  }, [user?.token, filteredTickets]);

  useEffect(() => {
    fetchTickets();
    fetchDepartments();
    fetchCategories();
    fetchSubCategories();
    fetchAssets();
    fetchTechnicians();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Helper functions
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

  const handleDateFilterChange = (e) => {
    setDateFilter(e.target.value);
    setCurrentPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-500">Loading tickets...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4 p-4 md:p-6">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          Report Management
        </h1>
      </div>
      <main className="flex flex-1 flex-col gap-4 px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="flex flex-col gap-4">
            {/* Filter by Date */}
            <div className="flex flex-col gap-2">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Filter by Date
              </h4>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className={`w-full justify-start text-left font-normal ${!dateFilter && "text-muted-foreground"}`}
                  >
                    {dateFilter ? format(new Date(dateFilter), "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={dateFilter ? new Date(dateFilter) : undefined}
                    onSelect={(date) => {
                      handleDateFilterChange({ target: { value: date ? format(date, "yyyy-MM-dd") : "" } });
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Filter by Department */}
            <div className="flex flex-col gap-2">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Filter by Department
              </h4>
              <Select
                onValueChange={handleFilterChange(setDepartmentFilter)}
                defaultValue="all"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select department" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Departments</SelectItem>
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.name}>
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Category */}
            <div className="flex flex-col gap-2">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Filter by Category
              </h4>
              <Select
                onValueChange={handleFilterChange(setCategoryFilter)}
                defaultValue="all"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.name}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Sub-Category */}
            <div className="flex flex-col gap-2">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Filter by Sub-Category
              </h4>
              <Select
                onValueChange={handleFilterChange(setSubCategoryFilter)}
                defaultValue="all"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select sub-category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sub-Categories</SelectItem>
                  {subCategories && subCategories.map((subCategory) => (
                    <SelectItem key={subCategory.id} value={subCategory.name}>
                      {subCategory.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Asset */}
            <div className="flex flex-col gap-2">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Filter by Asset
              </h4>
              <Select
                onValueChange={handleFilterChange(setAssetFilter)}
                defaultValue="all"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select asset" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Assets</SelectItem>
                  {assets && assets.map((asset) => (
                    <SelectItem key={asset.id} value={asset.item_code}>
                      {asset.item_code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Filter by Technician */}
            <div className="flex flex-col gap-2">
              <h4 className="scroll-m-20 text-xl font-semibold tracking-tight">
                Filter by Technician
              </h4>
              <Select
                onValueChange={handleFilterChange(setTechnicianFilter)}
                defaultValue="all"
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select technician" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Technicians</SelectItem>
                  {technicians.map((technician) => (
                    <SelectItem key={technician.id} value={technician.name}>
                      {technician.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search tickets..."
                  className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px] dark:bg-gray-800"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={exportTickets}>
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
                      <TableHead>TICKET ID</TableHead>
                      <TableHead>DEPARTMENT</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>TECHNICIAN</TableHead>
                      <TableHead>CREATED AT</TableHead>
                      <TableHead className="text-center">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.length > 0 ? (
                      paginatedTickets.map((ticket) => (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">
                            {`000-000-000-${String(ticket.id).padStart(3, "0")}`}
                          </TableCell>
                          <TableCell>{ticket.department_name || "N/A"}</TableCell>
                          <TableCell>{ticket.category_name || "N/A"}</TableCell>
                          <TableCell>{ticket.status || "N/A"}</TableCell>
                          <TableCell>{ticket.technician_name || "Unassigned"}</TableCell>
                          <TableCell>{ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "N/A"}</TableCell>
                          <TableCell className="text-center py-4 px-4">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() => handleViewTicket(ticket)}
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                            </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={7}
                          className="text-center py-8 text-gray-500"
                        >
                          No tickets found matching your criteria.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
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
                  Showing {filteredTickets.length > 0 ? startIndex + 1 : 0} -{" "}
                  {Math.min(endIndex, filteredTickets.length)} of{" "}
                  {filteredTickets.length} tickets
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
              </div>
            </div>
          </div>
        </div>
      </main>
            {/* View Ticket Dialog */}
            <ViewTicketDialog 
              ticketId={selectedTicketId} 
              open={viewTicketDialogOpen} 
              onOpenChange={setViewTicketDialogOpen} 
            />
          
    </div>
  );
}