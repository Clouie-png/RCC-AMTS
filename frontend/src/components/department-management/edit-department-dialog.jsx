import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Pencil } from "lucide-react";
import { EditDepartmentSuccessDialog } from "./edit-department-success-dialog";
import { AddEditErrorDialog } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

const API_URL = "http://localhost:3001";

export function EditDepartmentDialog({ department, fetchDepartments }) {
  const { user } = useAuth();
  const [editedDepartmentName, setEditedDepartmentName] = useState(department.name);
  const [editedDepartmentHead, setEditedDepartmentHead] = useState(department.head);
  const [editedDepartmentLocation, setEditedDepartmentLocation] = useState(department.location);
  const [editedDepartmentStatus, setEditedDepartmentStatus] = useState(department.status);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    setEditedDepartmentName(department.name);
    setEditedDepartmentHead(department.head);
    setEditedDepartmentLocation(department.location);
    setEditedDepartmentStatus(department.status);
  }, [department]);

  const handleEditDepartment = async () => {
    if (!editedDepartmentName || !editedDepartmentHead || !editedDepartmentLocation || !editedDepartmentStatus) {
      setErrorTitle("Missing Information");
      setErrorMessage("Please fill in all fields.");
      setShowErrorDialog(true);
      return;
    }

    try {
      // Make API call to update department
      await axios.put(
        `${API_URL}/departments/${department.id}`,
        {
          name: editedDepartmentName,
          head: editedDepartmentHead,
          location: editedDepartmentLocation,
          status: editedDepartmentStatus,
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );

      // Refresh the departments list
      await fetchDepartments();
      setShowSuccessDialog(true);
    } catch (error) {
      console.error("Error updating department:", error);
      setErrorTitle("Update Failed");
      setErrorMessage("Failed to update department. Please try again.");
      setShowErrorDialog(true);
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="ghost" size="icon">
            <Pencil className="h-4 w-4 text-blue-500" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Edit Department</AlertDialogTitle>
            <AlertDialogDescription>
              Update the details for {department.name}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="editDeptId">Department ID</Label>
              <Input
                id="editDeptId"
                value={`D-${String(department.id).padStart(3, "0")}`}
                disabled
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editDeptLocation">Location</Label>
              <Select onValueChange={setEditedDepartmentLocation} defaultValue={editedDepartmentLocation}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Floor">1st Floor</SelectItem>
                  <SelectItem value="2nd Floor">2nd Floor</SelectItem>
                  <SelectItem value="3rd Floor">3rd Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editDeptName">Department Name</Label>
              <Input
                id="editDeptName"
                value={editedDepartmentName}
                onChange={(e) => setEditedDepartmentName(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editDeptHead">Department Head</Label>
              <Input
                id="editDeptHead"
                value={editedDepartmentHead}
                onChange={(e) => setEditedDepartmentHead(e.target.value)}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="editDeptStatus">Status</Label>
              <Select onValueChange={setEditedDepartmentStatus} defaultValue={editedDepartmentStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleEditDepartment}>
              Save Changes
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <EditDepartmentSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        departmentName={editedDepartmentName}
      />
      <AddEditErrorDialog
        isOpen={showErrorDialog}
        onClose={() => setShowErrorDialog(false)}
        title={errorTitle}
        message={errorMessage}
      />
    </>
  );
}
