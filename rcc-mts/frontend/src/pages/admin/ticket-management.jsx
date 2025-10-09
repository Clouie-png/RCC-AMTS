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
import { Search, FileDown, Download } from "lucide-react";
import { BulkUploadDialog } from "@/components/bulk-upload";
import { useState, useEffect, useMemo, useCallback } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { AddTicketDialog, EditTicketDialog } from "@/components";
import { exportToCSV, downloadFile } from "@/lib/csv-utils";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

// --- Main Component ---

export function TicketManagement() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [subCategories, setSubCategories] = useState([]);
  const [users, setUsers] = useState([]);
  const [assets, setAssets] = useState([]);
  const [pcParts, setPcParts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchData = useCallback(async (endpoint, setDataFn) => {
    if (!user?.token) return;
    
    try {
      const response = await axios.get(`${API_BASE_URL}/${endpoint}`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setDataFn(response.data);
      setError(null);
    } catch (err) {
      console.error(`Error fetching ${endpoint}:`, err);
      setError(`Failed to fetch ${endpoint}`);
    }
  }, [user?.token]);

  const fetchTickets = useCallback(async () => {
    if (!user?.token) return;
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tickets`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      setTickets(response.data);
      setError(null);
    } catch (err) {
      console.error("Error fetching tickets:", err);
      setError("Failed to fetch tickets");
      alert("Failed to fetch tickets.");
    } finally {
      setLoading(false);
    }
  }, [user?.token]);

  const fetchAllData = useCallback(async () => {
    await Promise.all([
      fetchTickets(),
      fetchData('departments', setDepartments),
      fetchData('categories', setCategories),
      fetchData('sub-categories', setSubCategories),
      fetchData('users', setUsers),
      fetchData('assets', setAssets),
      fetchData('pc-parts', setPcParts),
    ]);
  }, [fetchData, fetchTickets]);

  // Function to export tickets to CSV
  const exportTicketsToCSV = () => {
    const data = tickets.map(ticket => ({
      "Ticket ID": `000-000-000-${String(ticket.id).padStart(3, "0")}`,
      "Department": ticket.department_name || "N/A",
      "Category": ticket.category_name || "N/A",
      "Sub-Category": ticket.subcategory_name || "N/A",
      "User": ticket.user_name || "N/A",
      "Asset": ticket.asset_item_code || "N/A",
      "PC Part": ticket.pc_part_name || "N/A",
      "Description": ticket.description || "N/A",
      "Status": ticket.status_name || "N/A",
      "Technician": ticket.technician_name || "Unassigned",
      "Created At": ticket.created_at || "N/A",
      "Updated At": ticket.updated_at || "N/A"
    }));
    
    exportToCSV(data, "tickets-export.csv");
  };

  // Function to download CSV template
  const downloadTemplate = () => {
    const csvContent = "Department ID,Category ID,Sub-Category ID,User ID,Asset ID,PC Part ID,Description,Status,Technician ID\n";
    downloadFile(csvContent, "tickets-template.csv", "text/csv;charset=utf-8;");
  };

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const filteredTickets = useMemo(() => {
    if (!Array.isArray(tickets) || tickets.length === 0) return [];
    
    return tickets.filter((ticket) => {
      const formattedTicketId = `000-000-000-${String(ticket.id).padStart(3, "0")}`;
      const matchesSearch =
        !searchQuery ||
        ticket.id?.toString().includes(searchQuery) ||
        formattedTicketId.includes(searchQuery) ||
        ticket.department_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.status_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ticket.technician_name?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesSearch;
    });
  }, [tickets, searchQuery]);

  const totalPages = useMemo(() => {
    return Math.ceil(filteredTickets.length / itemsPerPage);
  }, [filteredTickets.length, itemsPerPage]);

  const paginatedTickets = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredTickets.slice(startIndex, endIndex);
  }, [filteredTickets, currentPage, itemsPerPage]);

  // Reset to first page when search query or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4">
        <div className="text-red-500 text-lg mb-4">{error}</div>
        <button 
          onClick={fetchAllData}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4 p-4 md:p-6">
        <h1 className="scroll-m-20 text-center text-4xl font-extrabold tracking-tight text-balance">
          Ticket Management
        </h1>
      </div>
      <main className="flex flex-1 flex-col gap-4 px-4 md:px-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
              <Input
                type="search"
                placeholder="Search tickets (ID: 000-000-000-001, Department, Category, Status, Technician)..."
                className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px] dark:bg-gray-800"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-2">
              <AddTicketDialog 
                fetchTickets={fetchTickets} 
                departments={departments} 
                categories={categories} 
                subCategories={subCategories}
                users={users}
                assets={assets}
                pcParts={pcParts}
              />
              <BulkUploadDialog
                fetchItems={fetchTickets}
                entityName="Tickets"
                templateHeaders={["Department ID", "Category ID", "Sub-Category ID", "User ID", "Asset ID", "PC Part ID", "Description", "Status", "Technician ID"]}
                requiredFields={["Department ID", "Category ID", "Sub-Category ID", "User ID", "Description", "Status"]}
                endpoint="tickets"
                validationRules={{
                  "Department ID": (value) => {
                    const num = parseInt(value);
                    return !isNaN(num) && num > 0 ? true : "Department ID must be a valid positive integer";
                  },
                  "Category ID": (value) => {
                    const num = parseInt(value);
                    return !isNaN(num) && num > 0 ? true : "Category ID must be a valid positive integer";
                  },
                  "Sub-Category ID": (value) => {
                    const num = parseInt(value);
                    return !isNaN(num) && num > 0 ? true : "Sub-Category ID must be a valid positive integer";
                  },
                  "User ID": (value) => {
                    const num = parseInt(value);
                    return !isNaN(num) && num > 0 ? true : "User ID must be a valid positive integer";
                  },
                  "Status": (value) => {
                    return ["Open", "In Progress", "Closed", "For Approval"].includes(value) ? true : "Status must be either 'Open', 'In Progress', 'Closed', or 'For Approval'";
                  }
                }}
                fieldMappings={{
                  "Department ID": "department_id",
                  "Category ID": "category_id",
                  "Sub-Category ID": "subcategory_id",
                  "User ID": "user_id",
                  "Asset ID": "asset_id",
                  "PC Part ID": "pc_part_id",
                  "Description": "description",
                  "Status": "status",
                  "Technician ID": "technician_id"
                }}
              />
              <Button onClick={exportTicketsToCSV}>
                <FileDown className="mr-2 h-4 w-4" />
                EXPORT
              </Button>
            </div>
          </div>
          <Card>
            <CardContent className="h-full">
              {loading ? (
                <div className="flex justify-center items-center h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>TICKET ID</TableHead>
                      <TableHead>DEPARTMENT</TableHead>
                      <TableHead>CATEGORY</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>TECHNICIAN</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedTickets.length > 0 ? (
                      paginatedTickets.map((ticket) => {
                        console.log("Ticket in table:", ticket, "User role:", user.role);
                        return (
                          <TableRow key={ticket.id}>
                            <TableCell>{`000-000-000-${String(ticket.id).padStart(
                              3,
                              "0"
                            )}`}</TableCell>
                            <TableCell>{ticket.department_name || "N/A"}</TableCell>
                            <TableCell>{ticket.category_name || "N/A"}</TableCell>
                            <TableCell><span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                ticket.status_name === "Open"
                                  ? "bg-blue-100 text-blue-800"
                                  : ticket.status_name === "In Progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : ticket.status_name === "Closed"
                                  ? "bg-green-100 text-green-800"
                                  : ticket.status_name === "For Approval"
                                  ? "bg-purple-100 text-purple-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {ticket.status_name || "N/A"}
                            </span></TableCell>
                            <TableCell>{ticket.technician_name || "Unassigned"}</TableCell>
                            <TableCell className="text-right">
                              <EditTicketDialog
                                ticket={ticket}
                                fetchTickets={fetchTickets}
                                departments={departments}
                                categories={categories}
                                subCategories={subCategories}
                                users={users}
                                assets={assets}
                                pcParts={pcParts}
                              />
                            </TableCell>
                          </TableRow>
                        );
                      })
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center">
                          No tickets found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Select
                onValueChange={(value) => {
                  setItemsPerPage(Number(value));
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
                Showing {paginatedTickets.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} -{" "}
                {Math.min(currentPage * itemsPerPage, filteredTickets.length)} of{" "}
                {filteredTickets.length} tickets
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