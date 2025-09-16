import React, { useState } from "react";
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
import { PlusCircle, Loader2 } from "lucide-react";
import { AddDepartmentSuccessDialog } from "./add-department-success-dialog";
import { AddEditErrorDialog } from "@/components/common";
import { useAuth } from "@/context/AuthContext";
import axios from "axios";

// const API_BASE_URL = "http://localhost:3001";
import { API_BASE_URL } from '@/config/api'; // Import the centralized API URL

export function AddDepartmentDialog({ fetchDepartments, departments }) {
  const [newDepartmentName, setNewDepartmentName] = useState("");
  const [newDepartmentHead, setNewDepartmentHead] = useState("");
  const [newDepartmentLocation, setNewDepartmentLocation] = useState("");
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorTitle, setErrorTitle] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useAuth();

  const resetForm = () => {
    setNewDepartmentName("");
    setNewDepartmentHead("");
    setNewDepartmentLocation("");
  };

  const handleAddDepartment = async () => {
    if (!newDepartmentName || !newDepartmentHead || !newDepartmentLocation) {
      setErrorTitle("Missing Information");
      setErrorMessage("Please fill in all fields.");
      setShowErrorDialog(true);
      return;
    }

    if (departments.some(dept => dept.name.toLowerCase() === newDepartmentName.toLowerCase().trim())) {
      setErrorTitle("Duplicate Department Name");
      setErrorMessage(`Department with name "${newDepartmentName}" already exists.`);
      setShowErrorDialog(true);
      return;
    }

    setIsLoading(true);
    try {
      await axios.post(
        `${API_BASE_URL}/departments`,
        {
          name: newDepartmentName.trim(),
          location: newDepartmentLocation,
          head: newDepartmentHead.trim(),
          status: "Active",
        },
        {
          headers: { Authorization: `Bearer ${user.token}` },
        }
      );
      
      resetForm();
      setShowSuccessDialog(true);
      fetchDepartments();
    } catch (error) {
      console.error("Error adding department:", error);
      setErrorTitle("Error Adding Department");
      setErrorMessage(error.response?.data?.message || "An unexpected error occurred.");
      setShowErrorDialog(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button>
            <PlusCircle className="mr-2 h-4 w-4" />
            ADD
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Add New Department</AlertDialogTitle>
            <AlertDialogDescription>
              Fill in the details for the new department.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="deptName">Department Name</Label>
              <Input
                id="deptName"
                value={newDepartmentName}
                onChange={(e) => setNewDepartmentName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label htmlFor="deptLocation">Location</Label>
              <Select onValueChange={setNewDepartmentLocation} value={newDepartmentLocation} disabled={isLoading}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a location" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1st Floor">1st Floor</SelectItem>
                  <SelectItem value="2nd Floor">2nd Floor</SelectItem>
                  <SelectItem value="3rd Floor">3rd Floor</SelectItem>
                  <SelectItem value="4th Floor">4th Floor</SelectItem>
                  <SelectItem value="5th Floor">5th Floor</SelectItem>
                  <SelectItem value="6th Floor">6th Floor</SelectItem>
                  <SelectItem value="7th Floor">7th Floor</SelectItem>
                  <SelectItem value="8th Floor">8th Floor</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-col gap-2 col-span-2">
              <Label htmlFor="deptHead">Department Head</Label>
              <Input
                id="deptHead"
                value={newDepartmentHead}
                onChange={(e) => setNewDepartmentHead(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleAddDepartment} disabled={isLoading}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Add Department"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AddDepartmentSuccessDialog
        isOpen={showSuccessDialog}
        onClose={() => setShowSuccessDialog(false)}
        departmentName={newDepartmentName}
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
