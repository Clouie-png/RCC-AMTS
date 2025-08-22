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
import { FileDown, Search, Loader2 } from "lucide-react";
import { useState, useEffect, useMemo, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";
import { AddUserDialog, EditUserDialog, DeleteUserDialog, BulkUploadDialog } from "@/components/user-management";
import { exportToCSV, downloadUserTemplate } from "@/lib/csv-utils";

const API_URL = "http://localhost:3001";

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentFilter, setDepartmentFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  const fetchUsers = async () => {
    if (!user?.token) return;

    setIsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error("Error fetching users:", error);
      alert(`Error fetching users: ${error.response.data.message}`);
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchDepartments = async () => {
    if (!user?.token) return;
    try {
      const response = await axios.get(`${API_URL}/departments`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setDepartments(response.data);
    } catch (error) {
      console.error("Error fetching departments:", error);
      alert(`Error fetching departments: ${error.response.data.message}`);
    }
  };

  // Export all users to CSV
  const exportUsers = useCallback(async () => {
    if (!user?.token) return;

    try {
      // Fetch all users (not just the filtered ones)
      const response = await axios.get(`${API_URL}/users`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      
      const usersData = response.data;
      
      if (usersData.length === 0) {
        alert("No users to export.");
        return;
      }
      
      // Format data for export
      const data = usersData.map(user => ({
        "User ID": `U-${String(user.id).padStart(3, "0")}`,
        "User Name": user.name,
        "Department": user.department,
        "Role": user.role
      }));
      
      // Export to CSV
      exportToCSV(data, `users-export-${new Date().toISOString().slice(0, 19).replace(/:/g, "-")}.csv`);
      
      alert("Users exported successfully!");
    } catch (error) {
      console.error("Error exporting users:", error);
      alert(`Error exporting users: ${error.response?.data?.message || error.message}`);
    }
  }, [user?.token]);

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesDepartment =
        departmentFilter === "all" || user.department === departmentFilter;
      const matchesSearch =
        !searchQuery ||
        user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.id.toString().includes(searchQuery);
      return matchesDepartment && matchesSearch;
    });
  }, [users, departmentFilter, searchQuery]);

  const totalPages = Math.ceil(filteredUsers.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

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

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin" />
          <p className="text-sm text-gray-500">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="flex items-center mb-4 p-4 md:p-6">
        <h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight">
          User Management
        </h1>
      </div>
      <main className="flex flex-1 flex-col gap-4 px-4 md:px-6">
        <div className="grid gap-6 md:grid-cols-[240px_1fr]">
          <div className="flex flex-col gap-4">
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
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Input
                  type="search"
                  placeholder="Search users..."
                  className="w-full rounded-lg bg-white pl-8 md:w-[200px] lg:w-[320px] dark:bg-gray-800"
                  value={searchQuery}
                  onChange={handleSearchChange}
                />
              </div>
              <div className="flex items-center gap-2">
                <AddUserDialog
                  fetchUsers={fetchUsers}
                  departments={departments}
                />
                <BulkUploadDialog
                  fetchUsers={fetchUsers}
                  departments={departments}
                />
                <Button onClick={exportUsers}>
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
                      <TableHead>USER ID</TableHead>
                      <TableHead>USER NAME</TableHead>
                      <TableHead>DEPARTMENT</TableHead>
                      <TableHead>ROLE</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedUsers.length > 0 ? (
                      paginatedUsers.map((user) => (
                        <TableRow key={user.id}>
                          <TableCell className="font-medium">
                            {`U-${String(user.id).padStart(3, "0")}`}
                          </TableCell>
                          <TableCell>{user.name}</TableCell>
                          <TableCell>{user.department}</TableCell>
                          <TableCell>{user.role}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <EditUserDialog
                                user={user}
                                fetchUsers={fetchUsers}
                                departments={departments}
                              />
                              <DeleteUserDialog
                                user={user}
                                fetchUsers={fetchUsers}
                              />
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell
                          colSpan={5}
                          className="text-center py-8 text-gray-500"
                        >
                          No users found matching your criteria.
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
                  Showing {filteredUsers.length > 0 ? startIndex + 1 : 0} -{" "}
                  {Math.min(endIndex, filteredUsers.length)} of{" "}
                  {filteredUsers.length} users
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
                <Button onClick={downloadUserTemplate}>
                  <FileDown className="mr-2 h-4 w-4" />
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