import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Textarea } from "@/components/ui/textarea";
import { Search, Eye, Pencil } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function TicketManagement() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  
  // Dialog states
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [editStatus, setEditStatus] = useState("");
  const [editResolution, setEditResolution] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);
        const response = await axios.get(`${API_BASE_URL}/tickets`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        // Filter tickets assigned to the current maintenance user
        const assignedTickets = response.data.filter(
          (ticket) => ticket.technician_id === user.id
        );

        setTickets(assignedTickets);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user?.token]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      !searchQuery ||
      ticket.id?.toString().includes(searchQuery) ||
      ticket.department_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      ticket.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.status_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTickets = filteredTickets.slice(startIndex, endIndex);

  // Reset to first page when search query or items per page changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, itemsPerPage]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  // Handle view ticket
  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setViewDialogOpen(true);
  };

  // Handle edit ticket
  const handleEditTicket = (ticket) => {
    setSelectedTicket(ticket);
    setEditStatus(ticket.status_name || "");
    // Only initialize resolution if status is For Approval
    setEditResolution(ticket.status_name === "For Approval" ? (ticket.resolution || "") : "");
    setEditDialogOpen(true);
  };

  // Handle save changes
  const handleSaveChanges = async () => {
    if (!selectedTicket || !user?.token) return;

    const originalStatus = selectedTicket.status_name;
    const newStatus = editStatus;

    try {
      const updateData = {
        status: newStatus,
      };

      // Only include resolution if status is Closed
      if (newStatus === "Closed") {
        updateData.resolution = editResolution;
      }

      await axios.put(
        `${API_BASE_URL}/tickets/${selectedTicket.id}`,
        updateData,
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      // Update local state
      setTickets(tickets.map(ticket => 
        ticket.id === selectedTicket.id 
          ? { ...ticket, status_name: newStatus, resolution: newStatus === "Closed" ? editResolution : ticket.resolution } 
          : ticket
      ));

      // If status changed to "In Progress" or "Closed", send a notification
      if ((newStatus === "In Progress" || newStatus === "Closed") && newStatus !== originalStatus) {
        const message = `Ticket #${selectedTicket.id} has been updated to "${newStatus}" by ${user.name}.`;
        try {
          await axios.post(
            `${API_BASE_URL}/notifications/broadcast`,
            {
              ticket_id: selectedTicket.id,
              message: message,
            },
            {
              headers: { Authorization: `Bearer ${user.token}` },
            }
          );
        } catch (notificationError) {
          console.error("Error sending notification:", notificationError);
          // Optionally, inform the user that the notification failed to send
          alert("Ticket updated, but failed to send notification.");
        }
      }

      // Close dialog and reset
      setEditDialogOpen(false);
      setSelectedTicket(null);
      setEditStatus("");
      setEditResolution("");
      
      // Show success message
      alert("Ticket updated successfully!");
    } catch (error) {
      console.error("Error updating ticket:", error);
      alert("Failed to update ticket. Please try again.");
    }
  };

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6">
      <div className="mb-6">
        <h2 className="scroll-m-20 text-2xl font-bold tracking-tight">
          My Tickets
        </h2>
        <p className="text-muted-foreground">
          View and manage tickets assigned to you
        </p>
      </div>

      <div className="flex flex-col gap-6">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="search"
            placeholder="Search by ticket ID, department, category, status, or description..."
            className="w-full rounded-lg bg-white pl-10 pr-4 py-6 shadow-sm md:w-[350px] lg:w-[450px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* Tickets Table */}
        <Card className="shadow-sm">
          <CardHeader className="border-b">
            <CardTitle className="flex items-center justify-between">
              <span className="scroll-m-20 text-2xl font-semibold tracking-tight"> Tickets</span>
              <span className="scroll-m-20 text-2xl font-semibold tracking-tight">
                # of Tickets: {filteredTickets.length} 
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : (
              <>
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/50 hover:bg-muted/50">
                      <TableHead className="font-bold text-muted-foreground px-4">
                        TICKET ID
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground px-4">
                        DATE
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground px-4">
                        DEPARTMENT
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground px-4">
                        CATEGORY
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground px-4">
                        STATUS
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground px-4">
                        TECHNICIAN
                      </TableHead>
                      <TableHead className="font-bold text-muted-foreground text-center px-4">
                        ACTIONS
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody> 
                    {paginatedTickets.length > 0 ? (
                      paginatedTickets.map((ticket) => (
                        <TableRow
                          key={ticket.id}
                          className="border-b hover:bg-muted/30 transition-colors"
                        >
                          <TableCell className="font-medium py-4 px-4">
                            {`000-000-000-${String(ticket.id).padStart(
                              3,
                              "0"
                            )}`}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            {formatDate(ticket.created_at)}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            {ticket.department_name || "N/A"}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            {ticket.category_name || "N/A"}
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                                ticket.status_name === "Open"
                                  ? "bg-blue-100 text-blue-800"
                                  : ticket.status_name === "In Progress"
                                  ? "bg-yellow-100 text-yellow-800"
                                  : ticket.status_name === "Closed"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-800"
                              }`}
                            >
                              {ticket.status_name || "N/A"}
                            </span>
                          </TableCell>
                          <TableCell className="py-4 px-4">
                            {ticket.technician_name || "Unassigned"}
                          </TableCell>
                          <TableCell className="text-center py-4 px-4">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => handleViewTicket(ticket)}
                            >
                              <Eye className="h-4 w-4 text-blue-600" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full"
                              onClick={() => handleEditTicket(ticket)}
                            >
                              <Pencil className="h-4 w-4 text-blue-600" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-12 px-4">
                          <div className="flex flex-col items-center justify-center">
                            <Search className="h-12 w-12 text-muted-foreground mb-4" />
                            <h3 className="text-lg font-medium mb-1">
                              No tickets found
                            </h3>
                            <p className="text-muted-foreground">
                              Try adjusting your search query
                            </p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>

                {/* Pagination Controls */}
                {filteredTickets.length > 0 && (
                  <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t">
                    <div className="flex items-center gap-4 mb-4 sm:mb-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-muted-foreground">Rows per page:</span>
                        <Select
                          value={itemsPerPage.toString()}
                          onValueChange={(value) => {
                            setItemsPerPage(Number(value));
                            setCurrentPage(1); // Reset to first page when changing items per page
                          }}
                        >
                          <SelectTrigger className="w-[70px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="5">5</SelectItem>
                            <SelectItem value="10">10</SelectItem>
                            <SelectItem value="20">20</SelectItem>
                            <SelectItem value="50">50</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <span className="text-sm text-muted-foreground">
                        Showing {paginatedTickets.length > 0 ? startIndex + 1 : 0} -{" "}
                        {Math.min(endIndex, filteredTickets.length)} of{" "}
                        {filteredTickets.length} tickets
                      </span>
                    </div>
                    <div className="flex items-center">
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

                          {/* Show page numbers */}
                          {Array.from(
                            { length: Math.min(5, totalPages) },
                            (_, i) => {
                              // Calculate start page for pagination window
                              let startPage = 1;
                              if (totalPages > 5) {
                                if (currentPage <= 3) {
                                  startPage = 1;
                                } else if (currentPage >= totalPages - 2) {
                                  startPage = totalPages - 4;
                                } else {
                                  startPage = currentPage - 2;
                                }
                              }

                              const page = startPage + i;
                              return (
                                <PaginationItem key={page}>
                                  <PaginationLink
                                    href="#"
                                    isActive={currentPage === page}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      setCurrentPage(page);
                                    }}
                                  >
                                    {page}
                                  </PaginationLink>
                                </PaginationItem>
                              );
                            }
                          )}

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
                                currentPage === totalPages || totalPages === 0
                                  ? "pointer-events-none opacity-50"
                                  : ""
                              }
                            />
                          </PaginationItem>
                        </PaginationContent>
                      </Pagination>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>
      
      {/* View Ticket Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Ticket Details</DialogTitle>
            <DialogDescription>
              Viewing ticket #{selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Ticket ID:</label>
                <div className="col-span-3">
                  {`000-000-000-${String(selectedTicket.id).padStart(3, "0")}`}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Date Created:</label>
                <div className="col-span-3">{formatDate(selectedTicket.created_at)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Last Updated:</label>
                <div className="col-span-3">{formatDate(selectedTicket.updated_at)}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Department:</label>
                <div className="col-span-3">{selectedTicket.department_name || "N/A"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Category:</label>
                <div className="col-span-3">{selectedTicket.category_name || "N/A"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Sub-Category:</label>
                <div className="col-span-3">{selectedTicket.subcategory_name || "N/A"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Status:</label>
                <div className="col-span-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTicket.status_name === "Open"
                        ? "bg-blue-100 text-blue-800"
                        : selectedTicket.status_name === "In Progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedTicket.status_name === "Closed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedTicket.status_name || "N/A"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Created By:</label>
                <div className="col-span-3">{selectedTicket.user_name || "N/A"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Technician:</label>
                <div className="col-span-3">{selectedTicket.technician_name || "Unassigned"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Asset:</label>
                <div className="col-span-3">{selectedTicket.asset_item_code || "N/A"}</div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">PC Part:</label>
                <div className="col-span-3">{selectedTicket.pc_part_name || "N/A"}</div>
              </div>
              <div className="grid grid-cols-4 items-start gap-4">
                <label className="text-right font-medium">Description:</label>
                <div className="col-span-3">{selectedTicket.description || "N/A"}</div>
              </div>
              {selectedTicket.resolution && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <label className="text-right font-medium">Resolution:</label>
                  <div className="col-span-3">{selectedTicket.resolution}</div>
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setViewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Edit Ticket Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Edit Ticket</DialogTitle>
            <DialogDescription>
              Editing ticket #{selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Ticket ID:</label>
                <div className="col-span-3">
                  {`000-000-000-${String(selectedTicket.id).padStart(3, "0")}`}
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">Current Status:</label>
                <div className="col-span-3">
                  <span
                    className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                      selectedTicket.status_name === "Open"
                        ? "bg-blue-100 text-blue-800"
                        : selectedTicket.status_name === "In Progress"
                        ? "bg-yellow-100 text-yellow-800"
                        : selectedTicket.status_name === "Closed"
                        ? "bg-green-100 text-green-800"
                        : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    {selectedTicket.status_name || "N/A"}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <label className="text-right font-medium">New Status:</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger className="col-span-3">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Open">Open</SelectItem>
                    <SelectItem value="In Progress">In Progress</SelectItem>
                    <SelectItem value="Closed">Closed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {editStatus === "Closed" && (
                <div className="grid grid-cols-4 items-start gap-4">
                  <label className="text-right font-medium">Resolution:</label>
                  <Textarea
                    className="col-span-3 min-h-[120px]"
                    value={editResolution}
                    onChange={(e) => setEditResolution(e.target.value)}
                    placeholder="Enter resolution details..."
                  />
                </div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}