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
import { startOfWeek, endOfWeek, isWithinInterval } from "date-fns";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function AdminHome() {
  const { user } = useAuth();
  const [ticketSummary, setTicketSummary] = useState({
    Open: 0,
    "In Progress": 0,
    Closed: 0,
  });
  const [technicianAssignments, setTechnicianAssignments] = useState([]);
  const [departmentTicketsWeekly, setDepartmentTicketsWeekly] = useState([]);
  const [categorySummary, setCategorySummary] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      setIsLoading(true);
      try {
        const [ticketsRes, usersRes, departmentsRes, categoriesRes] =
          await Promise.all([
            axios.get(`${API_BASE_URL}/tickets`, {
              headers: { Authorization: `Bearer ${user.token}` },
            }),
            axios.get(`${API_BASE_URL}/users`, {
              headers: { Authorization: `Bearer ${user.token}` },
            }),
            axios.get(`${API_BASE_URL}/departments`, {
              headers: { Authorization: `Bearer ${user.token}` },
            }),
            axios.get(`${API_BASE_URL}/categories`, {
              headers: { Authorization: `Bearer ${user.token}` },
            }),
          ]);

        const tickets = ticketsRes.data;
        const users = usersRes.data;
        const departments = departmentsRes.data;
        const categories = categoriesRes.data;

        // 1. Ticket Summary
        const summary = { Open: 0, "In Progress": 0, Closed: 0 };
        tickets.forEach((ticket) => {
          if (summary[ticket.status] !== undefined) {
            summary[ticket.status]++;
          }
        });
        setTicketSummary(summary);

        // 2. Technician Assignments
        const technicians = users.filter((u) => u.role === "maintenance");
        const assignments = technicians.map((tech) => {
          const count = tickets.filter(
            (t) => t.technician_id === tech.id
          ).length;
          return { name: tech.name, assignments: count };
        });
        setTechnicianAssignments(assignments);

        // 3. Department Tickets (Weekly)
        const now = new Date();
        const startOfThisWeek = startOfWeek(now, { weekStartsOn: 1 }); // Monday
        const endOfThisWeek = endOfWeek(now, { weekStartsOn: 1 });
        const weeklyTickets = tickets.filter((ticket) =>
          isWithinInterval(new Date(ticket.created_at), {
            start: startOfThisWeek,
            end: endOfThisWeek,
          })
        );

        const deptTickets = departments.map((dept) => {
          const count = weeklyTickets.filter(
            (t) => t.department_id === dept.id
          ).length;
          return { name: dept.name, count };
        });
        setDepartmentTicketsWeekly(deptTickets);

        // 4. Category Summary
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
          Admin Dashboard
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
            <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight"> Technician Assignments</CardTitle>
          </CardHeader>
          <CardContent className="max-h-80 overflow-y-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Technician Name</TableHead>
                  <TableHead className="text-right">
                    No. of Assignments
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {technicianAssignments.map((tech) => (
                  <TableRow key={tech.name}>
                    <TableCell>{tech.name}</TableCell>
                    <TableCell className="text-right">
                      {tech.assignments}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="scroll-m-20 text-2xl font-semibold tracking-tight">Department Tickets (Weekly)</CardTitle>
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
