import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function MaintenanceHome() {
  const { user } = useAuth();
  const [assignedTickets, setAssignedTickets] = useState([]);
  const [ticketSummary, setTicketSummary] = useState({
    Open: 0,
    "In Progress": 0,
    Closed: 0,
  });
  const [departmentTicketsWeekly, setDepartmentTicketsWeekly] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        // Only fetch tickets endpoint which maintenance users can access
        const ticketsRes = await axios.get(`${API_BASE_URL}/tickets`, {
          headers: { Authorization: `Bearer ${user.token}` },
        });

        const tickets = ticketsRes.data;

        // 1. New Tickets Assigned to You (filter for current user)
        const userAssignedTickets = tickets
          .filter((ticket) => ticket.technician_id == user.id) // Use loose equality to handle type differences
          .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
          .slice(0, 5); // Limit to 5 most recent tickets
        
        setAssignedTickets(userAssignedTickets);

        // 2. Ticket Summary (system-wide)
        const summary = { Open: 0, "In Progress": 0, Closed: 0 };
        tickets.forEach((ticket) => {
          if (summary[ticket.status] !== undefined) {
            summary[ticket.status]++;
          }
        });
        setTicketSummary(summary);

        // 3. Department Tickets (system-wide)
        // Extract unique departments from tickets
        const departments = [...new Set(tickets.map(ticket => ticket.department_id))].map(id => ({
          id,
          name: tickets.find(t => t.department_id === id)?.department_name || `Department ${id}`
        }));

        const deptTickets = departments.map((dept) => {
          const count = tickets.filter(
            (t) => t.department_id === dept.id
          ).length;
          return { name: dept.name, count };
        });
        setDepartmentTicketsWeekly(deptTickets);

        // 4. Category Summary (system-wide)
        // Extract unique categories from tickets
        const categories = [...new Set(tickets.map(ticket => ticket.category_id))].map(id => ({
          id,
          name: tickets.find(t => t.category_id === id)?.category_name || `Category ${id}`
        }));

        const catSummary = categories.map((cat) => {
          const count = tickets.filter((t) => t.category_id === cat.id).length;
          return { name: cat.name, count };
        });
        setCategorySummary(catSummary);
      } catch (error) {
        console.error("Error fetching dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user]);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return format(new Date(dateString), "MMM dd, yyyy");
  };

  const currentDate = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col p-4 md:p-6 overflow-hidden">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight text-balance">
          Hello, {user?.name || "Maintenance User"}!
        </h1>
        <p className="text-xl font-semibold">{currentDate}</p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 overflow-auto">
        
        <Card>
          <CardHeader>
            <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">Ticket Summary</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Count</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {Object.entries(ticketSummary).map(([status, count]) => (
                  <TableRow key={status}>
                    <TableCell>{status}</TableCell>
                    <TableCell className="text-right">{count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">Department Tickets</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Department</TableHead>
                  <TableHead className="text-right">#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departmentTicketsWeekly.map((dept) => (
                  <TableRow key={dept.name}>
                    <TableCell>{dept.name}</TableCell>
                    <TableCell className="text-right">{dept.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">Category Summary</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">#</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {categorySummary.map((cat) => (
                  <TableRow key={cat.name}>
                    <TableCell>{cat.name}</TableCell>
                    <TableCell className="text-right">{cat.count}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}