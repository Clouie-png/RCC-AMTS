import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import { Search, Eye, Bell, Check, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import { useNotification } from "@/context/NotificationContext";
import { ViewTicketDialog } from "@/components/ticket-management";
import axios from "axios";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function FacultyStaffPage() {
  const { user, logout } = useAuth();
  const { notifications, markAsRead, markAllAsRead } = useNotification();
  const [tickets, setTickets] = useState([]);
  const [statuses, setStatuses] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [loading, setLoading] = useState(true);
  const [viewTicketDialogOpen, setViewTicketDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  const unreadNotifications = notifications.filter((n) => !n.is_read);

  const handleNotificationClick = (notification) => {
    // Mark as read
    if (!notification.is_read) {
      markAsRead(notification.id);
    }

    // Use the ticket_id from the notification data
    if (notification.ticket_id) {
      setSelectedTicketId(notification.ticket_id);
      setViewTicketDialogOpen(true);
    }
  };

  const handleViewTicket = (ticket) => {
    setSelectedTicketId(ticket.id);
    setViewTicketDialogOpen(true);
  };

  const handleStatusUpdate = async (ticketId, statusName) => {
    try {
      const status = statuses.find(s => s.name === statusName);
      if (!status) {
        alert("Invalid status");
        return;
      }
      await axios.put(`${API_BASE_URL}/tickets/${ticketId}`, { status_id: status.id }, { headers: { Authorization: `Bearer ${user.token}` } });
      fetchTickets();
    } catch (error) {
      console.error("Error updating ticket status:", error);
      alert("Failed to update ticket status.");
    }
  };

  useEffect(() => {
    const fetchTickets = async () => {
      if (!user?.token) return;

      try {
        setLoading(true);
        const [ticketsRes, statusesRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/tickets`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
          axios.get(`${API_BASE_URL}/statuses`, {
            headers: { Authorization: `Bearer ${user.token}` },
          }),
        ]);

        // Filter tickets to only show those created by the current user
        const userTickets = ticketsRes.data.filter(ticket => 
          ticket.user_id === user.id
        );
        setTickets(userTickets);
        setStatuses(statusesRes.data);
      } catch (error) {
        console.error("Error fetching tickets:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [user?.token, user?.id]);

  const filteredTickets = tickets.filter((ticket) => {
    const matchesSearch =
      !searchQuery ||
      ticket.id?.toString().includes(searchQuery) ||
      ticket.department_name
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase()) ||
      ticket.category_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.status_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      ticket.technician_name?.toLowerCase().includes(searchQuery.toLowerCase());
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

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden">
      <div className="mb-6 flex items-center justify-between">
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-500" />
          <Input
            type="search"
            placeholder="Search by ticket ID, department, category, status, or technician..."
            className="w-full rounded-lg bg-white pl-10 pr-4 py-6 shadow-sm md:w-[350px] lg:w-[450px]"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        {/* User Profile */}
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Bell className="h-5 w-5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                    {unreadNotifications.length}
                  </span>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
              <div className="p-2 font-bold">Notifications</div>
              <DropdownMenuSeparator />
              {notifications.length > 0 ? (
                notifications.map((notification) => (
                  <DropdownMenuItem
                    key={notification.id}
                    onSelect={() => handleNotificationClick(notification)}
                    className={`cursor-pointer ${!notification.is_read ? 'bg-blue-50' : ''}`}
                  >
                    <div className="flex flex-col">
                      <span className="text-sm text-gray-800">
                        {notification.message}
                      </span>
                      <span className="text-xs text-gray-500">
                        {new Date(notification.created_at).toLocaleString()}
                      </span>
                    </div>
                  </DropdownMenuItem>
                ))
              ) : (
                <div className="p-2 text-center text-sm text-gray-500">
                  No new notifications
                </div>
              )}
              {notifications.length > 0 && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onSelect={markAllAsRead} className="cursor-pointer justify-center">
                    Mark all as read
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="text-right">
          <p className="text-sm font-medium">{user?.name || "User"}</p>
          <p className="text-xs text-muted-foreground capitalize">
            {user?.role || "faculty-staff"} - My Tickets Only
          </p>
        </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Avatar className={"h-10 w-10 cursor-pointer"}>
                <AvatarFallback>
                  {user?.name?.charAt(0).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout}>Logout</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <main className="flex flex-1 flex-col gap-4 overflow-auto">
        <div className="flex flex-col gap-4">
          {/* Tickets Table */}
          <Card className="shadow-sm">
            <CardHeader className="border-b">
              <CardTitle className="flex items-center justify-between">
                <span className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  {" "}
                  My Tickets
                </span>
                <span className="scroll-m-20 text-2xl font-semibold tracking-tight">
                  # of Tickets: {filteredTickets.length}
                </span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0 max-h-[600px] overflow-y-auto">
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
                                    : ticket.status_name === "For Approval"
                                    ? "bg-purple-100 text-purple-800"
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
                                onClick={() => handleStatusUpdate(ticket.id, 'Closed')}
                                disabled={ticket.status_name !== 'For Approval'}
                              >
                                <Check className="h-4 w-4 text-green-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="rounded-full"
                                onClick={() => handleStatusUpdate(ticket.id, 'Open')}
                                disabled={ticket.status_name !== 'For Approval'}
                              >
                                <X className="h-4 w-4 text-red-600" />
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                        <TableRow>
                          <TableCell
                            colSpan={7}
                            className="text-center py-12 px-4"
                          >
                            <div className="flex flex-col items-center justify-center">
                              <Search className="h-12 w-12 text-muted-foreground mb-4" />
                              <h3 className="text-lg font-medium mb-1">
                                No tickets found
                              </h3>
                              <p className="text-muted-foreground">
                                Try adjusting your search query.
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
