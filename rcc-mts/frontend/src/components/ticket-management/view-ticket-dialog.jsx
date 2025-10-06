import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

// Format date for display
const formatDate = (dateString) => {
  if (!dateString) return "N/A";
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

export function ViewTicketDialog({ ticketId, open, onOpenChange }) {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && ticketId && user?.token) {
      fetchTicketDetails();
    }
  }, [open, ticketId, user?.token]);

  const fetchTicketDetails = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_BASE_URL}/tickets`, {
        headers: { Authorization: `Bearer ${user.token}` },
      });
      
      // Find the specific ticket
      const foundTicket = response.data.find(t => t.id === parseInt(ticketId));
      setTicket(foundTicket);
    } catch (error) {
      console.error("Error fetching ticket details:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Ticket Details</DialogTitle>
          <DialogDescription>
            Viewing ticket #{ticketId}
          </DialogDescription>
        </DialogHeader>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : ticket ? (
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Ticket ID:</label>
              <div className="col-span-3">
                {`000-000-000-${String(ticket.id).padStart(3, "0")}`}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Date Created:</label>
              <div className="col-span-3">{formatDate(ticket.created_at)}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Last Updated:</label>
              <div className="col-span-3">{formatDate(ticket.updated_at)}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Department:</label>
              <div className="col-span-3">{ticket.department_name || "N/A"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Category:</label>
              <div className="col-span-3">{ticket.category_name || "N/A"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Sub-Category:</label>
              <div className="col-span-3">{ticket.subcategory_name || "N/A"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Status:</label>
              <div className="col-span-3">
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
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Created By:</label>
              <div className="col-span-3">{ticket.user_name || "N/A"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Technician:</label>
              <div className="col-span-3">{ticket.technician_name || "Unassigned"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">Asset:</label>
              <div className="col-span-3">{ticket.asset_item_code || "N/A"}</div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <label className="text-right font-medium">PC Part:</label>
              <div className="col-span-3">{ticket.pc_part_name || "N/A"}</div>
            </div>
            <div className="grid grid-cols-4 items-start gap-4">
              <label className="text-right font-medium">Description:</label>
              <div className="col-span-3">{ticket.description || "N/A"}</div>
            </div>
            {ticket.resolution && (
              <div className="grid grid-cols-4 items-start gap-4">
                <label className="text-right font-medium">Resolution:</label>
                <div className="col-span-3">{ticket.resolution}</div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <p className="text-muted-foreground">Ticket not found or access denied.</p>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)}>Close</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}